require('../lib/underscore');

var sys = require('sys');

var utf8  = require('../lib/utf8');
var sql   = require("../vendors/minimal/sql"),
    util  = require('../vendors/ultrafilter/util'),
    html = require('../vendors/minimal/html');

function sqlTime(time) {
  return "'" + time.getUTCFullYear() + "-" + (time.getUTCMonth() + 1) + "-" + time.getUTCDate() +
  " " + time.getUTCHours() + ":" + time.getUTCMinutes() + ":" + time.getUTCSeconds() + "'" ;
}

exports.app = function(env) {

  return function(req, res, variant, user, noop, time) {
    user = utf8.decode(unescape(user));
    var lang = env.services.variants[variant] || variant,
        cache = env.cache,
        wikiConn = env.conns[lang + '-wiki'];

    if(time) {
      time = new Date(parseInt(time));
    } else {
      time = new Date(new Date().getTime() - 30*24*60*60*1000);
    }

    var query = require('url').parse(req.url, true).query,
    jsonp = query?(query.callback || query.jsonp):undefined;

    var rcConn = env.conns[lang + '-rc'];
    rcConn.queryFetch("select ntf.ntf_talk_title, rc.rc_page_id, rc.rc_timestamp from notifications as ntf, recentchanges as rc where ntf.ntf_rc_id = rc.rc_id and rc.rc_timestamp > " + sqlTime(time) + " and ntf.ntf_user = '" + user + "' order by rc.rc_timestamp desc limit 100",
      function(notifications) {
        var ntf = [], ntfKeys = [];
        _.each(notifications, function(notification) {
            var key = notification.rc_page_id + ":" + notification.rc_timestamp;
            if(_.indexOf(ntfKeys, key) === -1) {
              ntf.push({
                title: notification.ntf_talk_title,
                pageId: notification.rc_page_id,
                timestamp: notification.rc_timestamp,
              });
              ntfKeys.push(key);
            }
        });
        if(jsonp)
          res.simpleJsonp(200, ntf, jsonp);
        else
          res.simpleJson(200, ntf);
      }
    );

    var referer = req.headers.referer;
    util.markAccess(rcConn, util.refUser(referer, lang, variant), 'ntf');
  };
};


