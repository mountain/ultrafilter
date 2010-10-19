require('../../lib/underscore');

var sys    = require('sys'),
    Step   = require('../../lib/step'),
    router = require('./node-router');

exports.start = function(path) {
    var env = { path: path };

    Step(
      function() {
          require('./config').load(this, env);
      },
      function() {
          require('./template').load(this, env);
      },
      function(err) {
          if(err) throw err;
          require('./db').init(this, env);
      },
      function(err) {
          if(err) throw err;
          var server = router.getServer(logger.info);

          _(env.routers).chain().keys().each(function(key) {
              server.get(env.routers[key], require('../../app/' + key).app(env));
          });

          server.get(new RegExp("^/(.+)$"), router.staticDirHandler(env.cache, env.path + 'public'));

          server.listen(env.server.port, env.server.host);
      }
    );

}


