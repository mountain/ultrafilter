require('../../lib/underscore');
require('../../lib/log');

var Step = require('../../lib/step');

function insertRc(env, rc) {
  var reConn = env.conns[env.lang + '-rc'];
  Step(
      function() {
          rcConn.queryFetch("select rc_id from recentchanges where rc_id = " + rcId, this);
      },
      function(err, rows) {
          if(err) {
              logger.error('error when check duplicate:' + err);
          } else {
              if(rows.length > 0) return;
              rcConn.query("insert into recentchanges(rc_id, rc_ns, rc_page_id, rc_title, rc_timestamp)" +
                 " values(" + rc.rcid + "," + rc.ns + "," + rc.pageid + ",'" + rc.title + "','" + rc.timestamp +"')",
                 this
              );
          }
      },
      function(err, result) {
          if(err) {
              logger.error('error when inserting rc:' + err);
          } else {
              logger.info(rc.rcid, rc.ns, rc.pageid, rc.title, rc.timestamp);
          }
      }
  );
}

function fetchRc(callback, env) {
    var http = require('http'),
        host = env.host,
        wp = http.createClient(80, host),
        request = wp.request('GET',
          '/w/api.php?action=query&list=recentchanges&rcnamespace=0|1&rcprop=title|ids|timestamp|user&rcshow=!minor|!bot&rctype=edit&rclimit=5&format=json&callback=?',
          {
            'host': host,
            'User-Agent': 'Ultrafilter'
          }
        );
    request.end();

    request.on('response', function (response) {
      response.setEncoding('utf-8');
      var body = "";
      response.on('data', function (chunk) {
        chunk = chunk.toString('utf8');
        body = body + chunk;
      });
      response.on('end', function () {
        try {
          body = body.substring(1, body.length - 1);
          var data = JSON.parse(body);
          for(var ind in data.query.recentchanges) {
              var rc = data.query.recentchanges[ind],
              callback(env, rc);
          }
          body = '';
        } catch (e) {
          logger.error('error when fetching rc: ' + e);
          body = '';
       }
      });
    });
};

exports.start = function(lang, path) {
    Step(
      function() {
          require('./env').init(this, lang, path);
      },
      function(err, env) {
          if(err) logger.error('error when init env:' + err);

          var fetch = function() {
              Setp(
                  function() {
                    fetchRc(this, env);
                  },
                  function(err, env, rc) {
                    insertRc(env, rc);
                  }
              );
          };
          setInterval(fetch, env.batches[env.lang].fetch);
      }
    );
}
