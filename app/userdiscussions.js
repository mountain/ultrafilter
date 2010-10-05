exports.app = function(env) {
  var langs = env.services.langs;
  var msg = env.i18n.msg;
  var main = env.templates['main'];

  return function(req, res) {
      var html = main({langs: langs, msg: msg});
      res.simpleHtml(200, html);
  };
};


