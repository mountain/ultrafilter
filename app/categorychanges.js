require('../lib/underscore');

var sys = require('sys');

var utf8 = require('../lib/utf8');
var sql  = require("../vendors/ultrafilter/sql"),
    util = require('../vendors/ultrafilter/util');

var wikiConns = {};
var rcConns = {};

function setupConns(env, lang) {
  util.log("setup wikidb connections for " + lang);
  wikiConns[lang] = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.wiki);
  util.log("setup rcdb connections for " + lang);
  rcConns[lang] = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.rc);
}

exports.app = function(env) {

  var msg = env.i18n.msg;
  var unknown = env.templates['unknown'],
      cc = env.templates['categorychanges'];

  _.each(env.supported, function(lang) { setupConns(env, lang); } );

  var perpage = 100;
  return function(req, res, lang, name, noop) {
    name = utf8.decode(unescape(name));

    //util.log("handle request for " + lang + ":" + name);
    wikiConn = wikiConns[lang];
    wikiConn.queryFetch("select cat_id from category where cat_title = '" + name + "'", function(rows) {

      if(rows.length === 0) {
        var html = unknown({lang: lang, msg: msg});
        res.simpleHtml(200, html);
      } else {
        var catId = rows[0].cat_id;
        wikiConn.queryFetch("select distinct(cat_from) from catgraph where cat_to = " + catId, function(children) {
          var rcConn = rcConns[lang];

          rcConn.queryFetch(
            "select rc.rc_title, rc.rc_page_id, rc.rc_timestamp from filteredchanges as fc, recentchanges as rc where fc.fc_rc_id = rc.rc_id and rc.rc_ns = 0 and fc.fc_cat_id = " + catId + " order by rc.rc_timestamp desc limit " + perpage,
            function(changes) {
              rcConn.queryFetch(
                "select rc.rc_title, rc.rc_page_id, rc.rc_timestamp from filteredchanges as fc, recentchanges as rc where fc.fc_rc_id = rc.rc_id and rc.rc_ns = 1 and fc.fc_cat_id = " + catId + " order by rc.rc_timestamp desc limit " + perpage,
                function(talks) {
          var html = cc({lang: lang, msg: msg, category: name, changes:changes, talks: talks, encode:utf8.encode});
          res.simpleHtml(200, html);
                }
              );
            }
          );
        });
      }
    });
  };
};


