require('../../lib/underscore');
require('../../lib/log');

var Step = require('../../lib/step'),
    utf8 = require('../../lib/utf8'),
    cat  = require("./category");

function insertFc(env, rcId, pageId) {
    var rcConn = env.conns[env.lang + '-rc'];
    Step(
        function() {
            rcConn.queryFetchSync(
              "select fc_rc_id from filteredchanges where fc_rc_id = " + rcId, this);
        },
        function(err, rows) {
            if(err) {
            } else {
                if(rows.length === 0) {
                    categories = cat.categories(env, pageId);
                    _.each(categories, function(cat_id) {
                      env.rcConn.querySync(
                          "insert into filteredchanges(fc_rc_id, fc_cat_id)" +
                          " values(" + rcId + "," + cat_id + ")"
                      );
                    });
                }
            }
        }
    );
}

function insertNotification(env, rcId, user, talkTitle) {
    env.conns[env.lang + '-rc'].querySync(
        "insert into notifications(ntf_user, ntf_talk_title, ntf_rc_id)" +
         " values('" + user + "','" + talkTitle + "'," + rcId + ")");
}

function getArticle(env, talkTitle, callback) {
  var lang = env.lang || 'zh',
      host = lang + '.wikipedia.org';

  var http = require('http'),
      wp = http.createClient(80, host),
      request = wp.request('GET',
        '/w/api.php?action=query&prop=info&inprop=subjectid&format=json&callback=?&titles=' + encodeURI(talkTitle),
        {
          'host': host,
          'User-Agent': 'Ultrafilter'
        }
      );
  request.end();
  logger.info("check talk: " + env.lang + ":" + talkTitle);

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
          var page = data.query.pages[pageId];
          subjectid = page.subjectid;
          logger.info("subjectId(" + subjectid + ") for talk: " + env.lang + ":" + talkTitle);
          callback(subjectid);
          break;
        }
        body = "";
      } catch (e) {
        body = "";
        logger.error('error when parsing json: ' + e);
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
        '/w/api.php?action=query&prop=revisions&rvprop=user&rvlimit=50&format=json&callback=?&titles=' + encodeURI(talkTitle),
        {
          'host': host,
          'User-Agent': 'Ultrafilter'
        }
      );
  request.end();
  util.log("check talk: " + lang + ":" + talkTitle);

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
          var page = data.query.pages[pageId];
          revisions = page.revisions;
          logger.info("revisions for talk: " + lang + ":" + talkTitle);
          callback(revisions);
          break;
        }
        body = "";
      } catch (e) {
        body = "";
        logger.error('error when parsing json: ' + e);
      }
    });
  });
}

function dispatchTalk(env) {
    var rcConn = env.conns[env.lang + '-rc'];
    rcConn.queryFetchSync("select rc_id, rc_title from recentchanges where rc_ns=1 and rc_handled=0 limit 1",
        function(rows) {
            var rcId, talkTitle;
            if(rows.length > 0) {
              rcId = rows[0].rc_id;
              talkTitle = rows[0].rc_title;

              getArticle(env, talkTitle, function(pageId) {
                insertFc(env, rcId, pageId);
                env.rcConn.query("update recentchanges set rc_handled = 1 where rc_id =" + rcId);
                util.log("rc(" + rcId + ") had been handled.");
              });

              notifyParticipant(env, talkTitle, function(participants) {
                var notified = [];
                _.each(participants, function(participant) {
                  var user = participant.user;
                  if(_.indexOf(notified, user) === -1) {
                    insertNotification(env, rcId, user, talkTitle);
                    notified.push(user);
                  }
                });
              });
            }
        }
    );
}

exports.start = function(settings, lang) {
    Step(
      function() {
          require('./env').init(this, lang, path);
      },
      function(err, env) {
          if(err) logger.error('error when init env:' + err);

          var dispatch = function() {
            dispatchTalk(env);
          };
          setInterval(dispatch, env.rc[lang].intervals.dispatch);
      }
    );
}

