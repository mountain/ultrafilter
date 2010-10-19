require('../lib/underscore');

var util = require('../vendors/minimal/html');

exports.app = function(env) {
  var services = env.services,
      langs = services.langs,
      supported = services.supported,
      baseUrl = env.server.baseUrl(),
      msg = env.i18n.msg,
      n = env.templates['notifications'],
      unsupported = env.templates['unsupported'];

  return function(req, res, variant) {
    var html = undefined;
    var lang = env.services.variants[variant] || variant;
    lang = lang || 'en';
    if(_.indexOf(langs, variant) > -1) {
      var dir = util.htmlDir(env, variant);
      html = n({lang: lang, variant: variant, baseUrl: baseUrl, msg: msg, dir: dir, langs: langs, services: services});
    } else {
      html = unsupported({lang: lang, variant: variant, msg: msg});
    }
    res.simpleHtml(200, html);
  };
};


