require('../lib/underscore');

var sys = require('sys');

var utf8 = require('../lib/utf8');
var sql  = require("../vendors/ultrafilter/sql"),
    util = require('../vendors/ultrafilter/util'),
    html = require('../vendors/minimal/html');

var wikiConns = {};
var rcConns = {};

function setupConns(env, lang) {
  util.log("setup rcdb connections for " + lang);
  rcConns[lang] = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.rc);
}

exports.app = function(env) {

  var services = env.services,
      langs = services.langs,
      msg = env.i18n.msg,
      unknown = env.templates['unknown'],
      ud = env.templates['userdiscussions'],
      unsupported = env.templates['unsupported'];

  _.each(env.supported, function(lang) { setupConns(env, lang); } );

  var perpage = 100;
  return function(req, res, variant, user) {
    user = utf8.decode(unescape(user));
    var lang = env.services.variants[variant] || variant;
    lang = lang || 'en';
    var dir = html.htmlDir(env, variant);

    if(_.indexOf(langs, variant) === -1) {
      html = unsupported({lang: lang, variant: variant, msg: msg});
      res.simpleHtml(200, html);
    } else {
      util.log("handle request for " + variant + ":" + user);
      rcConn = rcConns[lang];
      rcConn.queryFetch("select ntf.ntf_talk_title, rc.rc_page_id, rc.rc_timestamp from notifications as ntf, recentchanges as rc where ntf.ntf_rc_id = rc.rc_id and ntf.ntf_user = '" + user + "' order by rc.rc_timestamp desc limit 100", function(rows) {
          var html = ud({lang: lang, variant: variant, langs: langs, dir: dir, services: services, msg: msg, user: user, discussions: rows});
        res.simpleHtml(200, html);
      });
    }
  };
};


