require('../../lib/underscore');

var sys    = require('sys'),
    Step   = require('../../lib/step'),
    router = require('./node-router');

var env = {};

exports.start = function() {

  Step(
      function() { require('./config').load(env); },
      function() { require('./template').load(env); },
      function() {
          var server = router.getServer(env.logger);

          _(routers).chain().keys().each(function(key) {
              server.get(routers[key], require('../../app/' + key).app(env));
          });

          server.get(new RegExp("^/(.+)$"), router.staticDirHandler(env.cache, env.path + 'public'));

          server.listen(env.port, env.host);
      }
  );

}


