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

  return function(req, res, variant, names, noop, time) {
    names = utf8.decode(unescape(names));
    names = names.split('|');
    var lang = env.services.variants[variant] || variant,
        cache = env.cache,
        wikiConn = wikiConns[lang];

    if(time) {
      time = new Date(parseInt(time));
    } else {
      time = new Date(new Date().getTime() - 30*24*60*60*1000);
    }

    var where = "(", last = names.length - 1;
    _.each(names, function(name, ind) {
        var subclause = "cat_title = '" + name + "'";
        where += (ind===last?subclause:(subclause + ' or '));
    });
    where += ")";

    util.log("handle request for " + variant+ ":" + names + ":" + time);
    util.cachedEntry(cache, 'catTitle2Id', names.join('|'), wikiConn, "select cat_id from category where " + where,
      function(catIds) {
        if(catIds.length === 0) {
          res.writeHead(404, {});
        } else {
          var where = "(", last = catIds.length - 1;
          _.each(catIds, function(catId, ind) {
              var subclause = "fc.fc_cat_id = " + catId.cat_id;
              where += (ind===last?subclause:(subclause + ' or '));
          });
          where += ")";

          var rcConn = rcConns[lang];
          rcConn.queryFetch("select rc.rc_title, rc.rc_page_id, rc.rc_timestamp from filteredchanges as fc, recentchanges as rc where fc.fc_rc_id = rc.rc_id and rc.rc_ns = 1 and " + where + " and rc.rc_timestamp > " + sqlTime(time) + " order by rc.rc_timestamp desc limit 100",
            function(changes) {
              var rc = [], rcKeys = [];
              _.each(changes, function(change) {
                  var key = change.rc_page_id + ":" + change.rc_timestamp;
                  if(_.indexOf(rcKeys, key) === -1) {
                    rc.push({
                      title: change.rc_title,
                      pageId: change.rc_page_id,
                      timestamp: change.rc_timestamp,
                    });
                    rcKeys.push(key);
                  }
              });
              res.simpleJson(200, rc);
            }
          );
        }
      }
    );
  };
};


