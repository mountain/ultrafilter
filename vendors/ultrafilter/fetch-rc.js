require('../../lib/underscore');

var sys = require('sys');

var sql = require("./sql");

var env = {
  rc: require('../../config/rc').rc
};

function log() {
    sys.print((new Date()).toUTCString() + " - ");
    sys.puts(_.toArray(arguments).join(" "));
}

function insertRc(rcConn, rcId, ns, pageId, title, timestamp) {
  var result = rcConn.querySync("select rc_id from recentchanges where rc_id = " + rcId);
  var rows = result.fetchAllSync();
  if(rows.length === 0) {
    rcConn.querySync("insert into recentchanges(rc_id, rc_ns, rc_page_id, rc_title, rc_timestamp)" +
         " values(" + rcId + "," + ns + "," + pageId + ",'" +  title + "','" + timestamp +"')"
    );
    log(rcId, ns, pageId, title, timestamp);
  }
}

function fetchRc(host, rcConn) {
    var http = require('http'),
        wp = http.createClient(80, host),
        request = wp.request('GET',
          '/w/api.php?action=query&list=recentchanges&rcnamespace=0|1&rcprop=title|ids|timestamp|user&rcshow=!minor|!bot&rctype=edit&rclimit=3&format=json&callback=?',
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
              insertRc(rcConn, rcId, ns, pageId, title, timestamp);
          }
          body = "";
        } catch (e) {
          sys.puts('error when parsing json: ' + e);
          body = "";
       }
      });
    });
};

exports.start = function(settings, lang) {
  _.extend(env, settings);
  if(_.indexOf(env.rc.supported, lang) == -1) throw 'unsuported lang: ' + lang;

  log("setup rcdb connections for " + lang);
  var rcConn = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.rc);

  var host = lang + '.wikipedia.org';
  var fetch = function() {
    fetchRc(host, rcConn);
  };
  setInterval(fetch, env.rc[lang].intervals.fetch);
}
