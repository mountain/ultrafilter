require('../lib/underscore');

var util = require('../vendors/minimal/util');

exports.app = function(env) {
  var services = env.services,
      langs = services.langs,
      msg = env.i18n.msg,
      home = env.templates['home'];

  return function(req, res, lang) {
    var html = undefined;
    var lang = lang || 'en';
    if(_.indexOf(langs, lang) > -1) {
      var dir = util.htmlDir(env, lang);
      html = home({lang: lang, msg: msg, dir: dir, langs: langs, services: services});
    } else {
      html = unsupported({lang: lang, msg: msg});
    }
    res.simpleHtml(200, html);
  };
};


