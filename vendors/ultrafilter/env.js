require('../../lib/underscore');
require('../../lib/log');

var Step = require('../../lib/step');

exports.init = function(callback, lang, path) {
    var host = lang + '.wikipedia.org',
        env  = { path: path, lang: lang, host: host };

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
          env.lang = lang;

          require('../minimal/db').init(this, env,
              function(key) {
                return key.substring(0, lang.length) === lang
              }
          );
      },
      function(err) {
          callback(err, env);
      }
    );

}
