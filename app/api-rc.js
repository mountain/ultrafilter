require('../lib/underscore');

var sys = require('sys');

var utf8  = require('../lib/utf8');
var sql   = require("../vendors/ultrafilter/sql"),
    util  = require('../vendors/ultrafilter/util'),
    util2 = require('../vendors/minimal/util');

var wikiConns = {};
var rcConns = {};

function setupConns(env, lang) {
  util.log("setup wikidb connections for " + lang);
  wikiConns[lang] = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.wiki);
  util.log("setup rcdb connections for " + lang);
  rcConns[lang] = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.rc);
}

function sqlTime(time) {
  return "'" + time.getUTCFullYear() + "-" + (time.getUTCMonth() + 1) + "-" + time.getUTCDate() +
  " " + time.getUTCHours() + ":" + time.getUTCMinutes() + ":" + time.getUTCSeconds() + "'" ;
}

exports.app = function(env) {

  _.each(env.supported, function(lang) { setupConns(env, lang); } );

  return function(req, res, lang, names, noop, time) {
    names = utf8.decode(unescape(names));

    if(time) {
      time = new Date(parseInt(time));
    } else {
      time = new Date(new Date().getTime() - 30*24*60*60*1000);
    }

    util.log("handle request for " + lang + ":" + names + ":" + time);
    wikiConn = wikiConns[lang];
    wikiConn.queryFetch("select cat_id from category where cat_title = '" + names + "'",
      function(rows) {
        if(rows.length === 0) {
          res.writeHead(404, {});
        } else {
          var catId = rows[0].cat_id;
          var rcConn = rcConns[lang];
          rcConn.queryFetch("select rc.rc_title, rc.rc_page_id, rc.rc_timestamp from filteredchanges as fc, recentchanges as rc where fc.fc_rc_id = rc.rc_id and fc.fc_cat_id = " + catId + " and rc.rc_timestamp > " + sqlTime(time) + " order by rc.rc_timestamp desc limit 100",
            function(changes) {
              _.each(changes, function(change) {
                  var rc = [];
                  rc.push({
                    title: change.rc_title,
                    pageId: change.rc_page_id,
                    timestamp: change.rc_timestamp,
                  });
                 res.simpleJson(200, rc);
              });
            }
          );
        }
      }
    );
  };
};


