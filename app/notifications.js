require('../lib/underscore');

var util = require('../vendors/minimal/util');

exports.app = function(env) {
  var services = env.services,
      langs = services.langs,
      supported = services.supported,
      baseUrl = env.baseUrl(),
      msg = env.i18n.msg,
      n = env.templates['notifications'],
      unsupported = env.templates['unsupported'];

  return function(req, res, lang) {
    var html = undefined;
    var lang = lang || 'en';
    if(_.indexOf(langs, lang) > -1) {
      var dir = util.htmlDir(env, lang);
      html = n({lang: lang, baseUrl: baseUrl, msg: msg, dir: dir, langs: langs, services: services});
    } else {
      html = unsupported({lang: lang, msg: msg});
    }
    res.simpleHtml(200, html);
  };
};


