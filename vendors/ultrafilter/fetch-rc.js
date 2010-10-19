require('../../lib/underscore');
require('../../lib/log');

var sys  = require('sys');
    Step = require('../../lib/step'),
    sql  = require('../minimal/sql'),
    util = require('./util');

function insertRc(rcConn, rcId, ns, pageId, title, timestamp) {

  Step(
      function() {
          rcConn.query("select rc_id from recentchanges where rc_id = " + rcId, this);
      },
      function(err, result) {
          if(err) {
              logger.error('error when check duplicate:' + err);
          } else {
              result.fetchAll(this);
          }
      },
      function(err, rows) {
          if(err) {
              logger.error('error when check duplicate:' + err);
          } else {
              if(rows.length > 0) return;
              rcConn.query("insert into recentchanges(rc_id, rc_ns, rc_page_id, rc_title, rc_timestamp)" +
                 " values(" + rcId + "," + ns + "," + pageId + ",'" +  title + "','" + timestamp +"')",
                 this
              );
          }
      },
      function(err, result) {
          if(err) {
              logger.error('error when inserting rc:' + err);
          } else {
              logger.info(rcId, ns, pageId, title, timestamp);
          }
      }
  );
}

function fetchRc(env) {
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
              rcId = rc.rcid,
              pageId = rc.pageid,
              ns = rc.ns,
              title = rc.title,
              timestamp = rc.timestamp;
              insertRc(env.conns[env.lang + '-rc'], rcId, ns, pageId, title, timestamp);
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
    var env  = { path: path };

    Step(
      function() {
          require('../minimal/config').load(this, env);
      },
      function(err) {
          if(err) logger.error('error when loading config:' + err);

          lang = env.services.variants[lang] || lang;
          if(_.indexOf(env.services.langs, lang) === -1 &&
             _.indexOf(_.values(env.services.variants), lang) === -1
          ) throw 'unsuported lang: ' + lang;

          var host = lang + '.wikipedia.org';
          _.extend(env, { lang: lang, host: host });

          require('../minimal/db').init(this, env,
              function(key) { key.substring(0, lang.length) === lang }
          );
      },
      function(err) {
          if(err) logger.error('error when init db:' + err);

          var fetch = function() {
              try {
                  fetchRc(env);
              } catch(e) {
                  logger.error('error when fetching rc:' + e);
              }
          };
          setInterval(fetch, env.batches[env.lang].fetch);
      }
    );

}
