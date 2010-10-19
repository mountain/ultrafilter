require('../lib/underscore');

var sys = require('sys');

var utf8  = require('../lib/utf8');
var sql   = require('../vendors/minimal/sql'),
    util  = require('../vendors/ultrafilter/util'),
    html = require('../vendors/minimal/html');

function sqlTime(time) {
  return "'" + time.getUTCFullYear() + "-" + (time.getUTCMonth() + 1) + "-" + time.getUTCDate() +
  " " + time.getUTCHours() + ":" + time.getUTCMinutes() + ":" + time.getUTCSeconds() + "'" ;
}

function fetchAllAlerts(env, res, lang, user, cats, record, jsonp) {
  var rcConn = env.conns[lang + '-rc'][lang];
  rcConn.queryFetch("select count(rc_id) as cnt from notifications, recentchanges where ntf_rc_id = rc_id and unix_timestamp(rc_timestamp) > '" + record.ntf + "' and ntf_user = '" + user + "'",
    function(rows) {
      if(rows.length > 0) {
        record.ntf = rows[0].cnt;
      } else {
        record.ntf = -1;
      }
      fetchRcRtAlerts(env, res, lang, user, cats, record, jsonp);
    }
  );
}

function fetchRcRtAlerts(env, res, lang, user, cats, record, jsonp) {
  var cache = env.cache,
      rcConn = env.conns[lang + '-rc'][lang],
      wikiConn = env.conns[lang + '-wiki'][lang];

  cats = cats.split('|');
  var where = "(", last = cats.length - 1;
  _.each(cats, function(cat, ind) {
      var subclause = "cat_title = '" + cat + "'";
      where += (ind===last?subclause:(subclause + ' or '));
  });
  where += ")";

  util.cachedDbEntry(cache, 'catTitle2Id', cats.join('|'), wikiConn, "select cat_id from category where " + where,
    function(catIds) {
      //sys.puts("catIds: " + sys.inspect(catIds));
      if(catIds.length > 0) {
        var where = "(", last = catIds.length - 1;
        _.each(catIds, function(catId, ind) {
            var subclause = "fc.fc_cat_id = " + catId.cat_id;
            where += (ind===last?subclause:(subclause + ' or '));
        });
        where += ")";

        rcConn.queryFetch("select count(fc.fc_id) as cnt from filteredchanges as fc, recentchanges as rc where fc.fc_rc_id = rc.rc_id and rc.rc_ns = 0 and " + where + " and unix_timestamp(rc.rc_timestamp) > " + record.rc,
          function(rows) {
            //sys.puts("rows: " + sys.inspect(rows));
            if(rows.length > 0) {
              record.rc = rows[0].cnt;
            } else {
              record.rc = -1;
            }
            rcConn.queryFetch("select count(fc.fc_id) as cnt from filteredchanges as fc, recentchanges as rc where fc.fc_rc_id = rc.rc_id and rc.rc_ns = 1 and " + where + " and unix_timestamp(rc.rc_timestamp) > " + record.rt,
              function(rows) {
                //sys.puts("rows: " + sys.inspect(rows));
                if(rows.length > 0) {
                  record.rt = rows[0].cnt;
                } else {
                  record.rt = -1;
                }
                if(jsonp)
                  res.simpleJsonp(200, record, jsonp);
                else
                  res.simpleJson(200, record);
              }
            );
          }
        );
      }
    }
  );
}

exports.app = function(env) {

  return function(req, res, variant, user, noop, cats) {
    user = utf8.decode(unescape(user));
    cats = utf8.decode(unescape(cats));
    var lang = env.services.variants[variant] || variant,
        cache = env.cache,
        rcConn = env.conns[lang + '-rc'];

    var query = require('url').parse(req.url, true).query,
    jsonp = query?(query.callback || query.jsonp):undefined;

    rcConn.queryFetch("select ac_type, unix_timestamp(ac_timestamp) as ac_timestamp from access where ac_user = '" + user + "'",
      function(accesses) {
        var record = {};
        _.each(accesses, function(access) {
            record[access.ac_type] = access.ac_timestamp;
        });

        record.rc = record.rc || 0;
        record.rt = record.rt || 0;
        record.ntf = record.ntf || 0;

        fetchAllAlerts(env, res, lang, user, cats, record, jsonp);
      }
    );
  };
};


