var _    = require('../lib/underscore')._,
    util = require('../vendors/minimal/util');

exports.app = function(env) {
  var services = env.services,
      langs = services.langs,
      msg = env.i18n.msg,
      baseUrl = env.baseUrl(),
      shorturl = env.templates['shorturl'],
      unsupported = env.templates['unsupported'];

  return function(req, res, variant) {
    var html = undefined;
    var lang = env.services.variants[variant] || variant;
    lang = lang || 'en';
    if(_.indexOf(langs, variant) > -1) {
      var dir = util.htmlDir(env, variant);
      html = shorturl({baseUrl: baseUrl, variant: variant, msg: msg, dir: dir, langs: langs, services: services});
    } else {
      html = unsupported({variant: variant, msg: msg});
    }
    res.simpleHtml(200, html);
  }
};


