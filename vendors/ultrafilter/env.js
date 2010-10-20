require('../../lib/underscore');
require('../../lib/log');

var Step = require('../../lib/step');

exports.init = function(callback, lang, path) {
    var env  = { path: path };

    Step(
      function() {
          require('../minimal/config').load(this, env);
      },
      function(err) {
          if(err) logger.error('error when loading config:' + err);

          lang = env.services.variants[lang] || lang;
          if(_.indexOf(env.services.langs, lang) === -1 &&
             _(env.services.variants).chain().values().indexOf(lang) === -1
          ) throw 'unsuported lang: ' + lang;

          var host = lang + '.wikipedia.org';
          _.extend(env, { lang: lang, host: host });

          require('../minimal/db').init(this, env,
              function(key) { key.substring(0, lang.length) === lang }
          );
      },
      function(err) {
          callback(err, env);
      }
    );

}
