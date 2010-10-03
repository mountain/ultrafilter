require('../../lib/underscore');

var sys = require('sys');

var utf8 = require('../../lib/utf8');
var cat = require("./category"),
    sql = require("./sql");

var env = {
  rc: require('../../config/rc').rc,
  cacheSize: 10000,
  cache: new (require('../../lib/cache').Cache)(this.cacheSize),
};

function log() {
    sys.print((new Date()).toUTCString() + " - ");
    sys.puts(_.toArray(arguments).join(" "));
}

function insertFc(env, rcId, pageId) {
  var result = env.rcConn.querySync("select fc_rc_id from filteredchanges where fc_rc_id = " + rcId);
  var rows = result.fetchAllSync();
  if(rows.length === 0) {
    _.each(categories(env.wikiConn, pageId), function(cat_id) {
      env.rcConn.querySync("insert into filteredchanges(fc_rc_id, fc_cat_id)" +
           " values(" + rcId + "," + cat_id + ")"
      );
    });
  }
}

function insertNotification(env, rcId, user, talkTitle) {
  env.rcConn.querySync("insert into notification(ntf_user, ntf_talk_title, ntf_rc_id)" +
       " values('" + user + "','" + talkTitle + "'," + rcId + ")");
}

function getArticle(env, talkTitle, callback) {
  var lang = env.lang || 'zh',
      host = lang + '.wikipedia.org';

  var http = require('http'),
      wp = http.createClient(80, host),
      request = wp.request('GET',
        '/w/api.php?action=query&prop=info&inprop=subjectid&format=json&callback=?&titles=' + utf8.encode(talkTitle),
        {
          'host': host,
          'User-Agent': 'Ultrafilter'
        }
      );
  request.end();
  log("check talk: " + env.lang + ":" + talkTitle);

  var subjectid, body = "";
  request.on('response', function (response) {
    response.setEncoding('utf-8');
    response.on('data', function (chunk) {
      body = body + chunk;
    });
    response.on('end', function () {
      try {
        body = body.substring(1, body.length - 1);
        log(body);
        var data = JSON.parse(body);
        for(var pageId in data.query.pages) {
          if(pageId > 0) {
            var page = data.query.pages[pageId];
            subjectid = page.subjectid;
            log("subjectId(" + subjectid + ") for talk: " + env.lang + ":" + talkTitle);
            callback(subjectid);
            break;
          }
        }
        body = "";
      } catch (e) {
        body = "";
        log('error when parsing json: ' + e);
      }
    });
  });
}

function notifyParticipant(env, talkTitle, callback) {
  var lang = env.lang || 'zh',
      host = lang + '.wikipedia.org';

  var http = require('http'),
      wp = http.createClient(80, host),
      request = wp.request('GET',
        '/w/api.php?action=query&prop=revisions&rvprop=user&format=json&callback=?&titles=' + utf8.encode(talkTitle),
        {
          'host': host,
          'User-Agent': 'Ultrafilter'
        }
      );
  request.end();
  log("check talk: " + lang + ":" + talkTitle);

  var subjectid, body = "";
  request.on('response', function (response) {
    response.setEncoding('utf-8');
    response.on('data', function (chunk) {
      body = body + chunk;
    });
    response.on('end', function () {
      try {
        body = body.substring(1, body.length - 1);
        var data = JSON.parse(body);
        for(var pageId in data.query.pages) {
          if(pageId > 0) {
            var page = data.query.pages[pageId];
            revisions = page.revisions;
            log("revisions for talk: " + env.lang + ":" + talkTitle);
            callback(revisions);
            break;
          }
        }
        body = "";
      } catch (e) {
        body = "";
        log('error when parsing json: ' + e);
      }
    });
  });
}

function dispatchTalk(env) {
  var result = env.rcConn.querySync("select rc_id, rc_title from recentchanges where rc_ns=1 and rc_handled=0 limit 1");
  var rows = result.fetchAllSync();
  var rcId, talkTitle;
  if(rows.length > 0) {
    rcId = rows[0].rc_id;
    talkTitle = rows[0].rc_title;

    getArticle(env, talkTitle, function(pageId) {
      insertFc(env, rcId, pageId);
      result = env.rcConn.querySync("update recentchanges set rc_handled = 1 where rc_id =" + rcId);
      log("rc(" + rcId + ") had been handled.");
    });

    notifyParticipant(env.lang, talkTitle, function(participants) {
      _.each(participants, function(participant) {
        insertNotification(env.rcConn, rcId, participant.user, talkTitle);
      });
    });
  }
}

exports.start = function(settings, lang) {
  _.extend(env, settings);
  if(_.indexOf(env.rc.supported, lang) == -1) throw 'unsuported env.lang: ' + env.lang;

  env.lang = lang;
  log("setup wikidb connections for " + env.lang);
  env.wikiConn = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[env.lang].db.wiki);
  log("setup rcdb connections for " + env.lang);
  env.rcConn = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[env.lang].db.rc);

  var dispatch = function() {
    dispatchTalk(env);
  };
  setInterval(dispatch, env.rc[lang].intervals.dispatch);
}

