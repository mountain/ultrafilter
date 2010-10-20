require('../../lib/underscore');
require('../../lib/log');

var cat  = require("./category"),
    Step = require('../../lib/step');

function insertFc(env, rcId, pageId) {
    Step(
        function() {
            env.conns[env.lang + '-rc'].
              queryFetchSync("select fc_rc_id from filteredchanges where fc_rc_id = " + rcId, this);
        },
        function(err, rows) {
            if(rows.length === 0) {
                categories = cat.categories(env, pageId);
                _.each(categories, function(cat_id) {
                    env.rcConn.
                      querySync("insert into filteredchanges(fc_rc_id, fc_cat_id)" +
                         " values(" + rcId + "," + cat_id + ")");
                });
            }
        }
    );
}

function populateCat(env) {
    var rcConn = env.conns[env.lang + '-rc'];
    Step(
        function() {
            rcConn.queryFetchSync(
                "select rc_id, rc_page_id from recentchanges where rc_ns=0 and rc_handled=0 limit 1", this);
        },
        function(err, rows) {
            if(err) {
                logger.error('query on recentchanges failed:' + err);
            } else {
                var rcId, pageId;
                if(rows.length > 0) {
                  rcId = rows[0].rc_id;
                  pageId = rows[0].rc_page_id;
                  insertFc(env, rcId, pageId);
                }
                if(rcId) {
                  rcConn.querySync(
                    "update recentchanges set rc_handled = 1 where rc_id =" + rcId,
                    function(result) {
                        logger.info("rc(" + rcId + ") had been handled.");
                    }
                  );
                }
            }
        },
    );
}

exports.start = function(lang, path) {
    var env  = { path: path };

    Step(
      function() {
          require('./env').init(this, lang, path);
      },
      function(err, env) {
          if(err) logger.error('error when init env:' + err);

          var populate = function() {
              try {
                  populateCat(env);
              } catch(e) {
                  logger.error('error when fetching rc:' + e);
              }
          };
          setInterval(populate, env.batches[env.lang].populate);
      }
    );

}

