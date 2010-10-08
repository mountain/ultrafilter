require('../lib/underscore');

var util = require('../vendors/minimal/util');

exports.app = function(env) {
  var services = env.services,
      langs = services.langs,
      msg = env.i18n.msg,
      home = env.templates['home'];

  return function(req, res, variant) {
    var html = undefined;
    var lang = env.services.variants[lang] || lang;
    lang = lang || 'en';
    if(_.indexOf(langs, variant) > -1) {
      var dir = util.htmlDir(env, variant);
      html = home({lang: lang, variant: variant, msg: msg, dir: dir, langs: langs, services: services});
    } else {
      html = unsupported({lang: lang, variant: variant, msg: msg});
    }
    res.simpleHtml(200, html);
  };
};


