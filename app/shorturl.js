var _    = require('../lib/underscore')._,
    util = require('../vendors/minimal/util');

exports.app = function(env) {
  var services = env.services,
      langs = services.langs,
      msg = env.i18n.msg,
      baseUrl = env.baseUrl(),
      shorturl = env.templates['shorturl'],
      unsupported = env.templates['unsupported'];

  return function(req, res, lang) {
    var html = undefined;
    var lang = lang || 'en';
    if(_.indexOf(langs, lang) > -1) {
      var dir = util.htmlDir(env, lang);
      html = shorturl({baseUrl: baseUrl, lang: lang, msg: msg, dir: dir, langs: langs, services: services});
    } else {
      html = unsupported({lang: lang, msg: msg});
    }
    res.simpleHtml(200, html);
  }
};


