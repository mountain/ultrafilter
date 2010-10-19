require('../lib/underscore');

var sys = require('sys');

var utf8  = require('../lib/utf8');
var sql   = require("../vendors/minimal/sql"),
    util  = require('../vendors/ultrafilter/util'),
    html = require('../vendors/minimal/html');

exports.app = function(env) {

  var services = env.services,
      langs = services.langs,
      baseUrl = env.server.baseUrl(),
      msg = env.i18n.msg,
      unknown = env.templates['unknown'],
      cc = env.templates['categorychanges'],
      unsupported = env.templates['unsupported'];

  var perpage = 100;
  return function(req, res, variant, name) {
    name = utf8.decode(unescape(name));
    var dir    = html.htmlDir(env, variant),
        subcat = msg[variant].subcategory,
        supcat = msg[variant].supcategory;
    var lang = env.services.variants[variant] || variant,
        cache = env.cache,
        wikiConn = env.conns[lang + '-wiki'];

    if(_.indexOf(langs, variant) === -1) {
      html = unsupported({lang: lang, variant: variant, msg: msg});
      res.simpleHtml(200, html);
    } else {
      //util.log("handle request for " + variant+ ":" + name);
      util.cachedDbEntry(cache, 'catTitle2Id', name, wikiConn, "select cat_id from category where cat_title = '" + name + "'", function(rows) {

        if(rows.length === 0) {
          var html = unknown({lang: lang, variant: variant, msg: msg});
          res.simpleHtml(200, html);
        } else {
          var catId = rows[0].cat_id;
          var rcConn = env.conns[lang + '-rc'];
          rcConn.queryFetch(
            "select rc.rc_title, rc.rc_page_id, rc.rc_timestamp from filteredchanges as fc, recentchanges as rc where fc.fc_rc_id = rc.rc_id and rc.rc_ns = 0 and fc.fc_cat_id = " + catId + " order by rc.rc_timestamp desc limit " + perpage,
            function(changes) {
              rcConn.queryFetch(
                "select rc.rc_title, rc.rc_page_id, rc.rc_timestamp from filteredchanges as fc, recentchanges as rc where fc.fc_rc_id = rc.rc_id and rc.rc_ns = 1 and fc.fc_cat_id = " + catId + " order by rc.rc_timestamp desc limit " + perpage,
                function(talks) {
          var html = cc({
            baseUrl: baseUrl, lang: lang, variant: variant, langs: langs, services: services, msg: msg, dir: dir,
            category: name, changes:changes, talks: talks, subcat: subcat, supcat: supcat, encode:utf8.encode
          });
          res.simpleHtml(200, html);
                }
              );
            }
          );
        }
      });
    }
  };
};


