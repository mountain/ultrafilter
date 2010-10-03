require('../../lib/underscore');

var sys = require('sys');

var utf8 = require('../lib/utf8');
var sql = require("./sql");

var cacheSize = 10000;
var cache = new (require('../../lib/cache').Cache)(cacheSize);
var env = {
  rc: require('../../config/rc').rc
};

function log() {
    sys.print((new Date()).toUTCString() + " - ");
    sys.puts(_.toArray(arguments).join(" "));
}

function get(wikiConn, catId) {
  var cats = cache['c' + catId];
  if(!cats) {
    cats = [];
    result = wikiConn.querySync("select distinct(cat_to) from catgraph where cat_from = " + catId);
    rows = result.fetchAllSync();
    _.each(rows, function(row) {
      var cat_to = row.cat_to;
      if(_.indexOf(cats, cat_to) === -1) {
        cats.push(cat_to);
      }
    });
    cache['c' + catId] = cats;
    if(result) result.freeSync();
  }
  return cats;
}

function categories(wikiConn, pageId) {
  var cats = [], mark = 0;

  var result = wikiConn.querySync("select distinct(cat_to) from catgraph where page_from = " + pageId);
  var rows = result.fetchAllSync();
  _.each(rows, function(row) {
      cats.push(row.cat_to)
  });
  result.freeSync();

  var len = cats.length;
  for(var i=0;i<len;i++) {
    parents = get(wikiConn, cats[i]);
    _.each(parents, function(parent) {
      if(_.indexOf(cats, parent) === -1) {
        cats.push(parent);
      }
    });
  }

  var len2 = cats.length;
  for(var i=len;i<len2;i++) {
    parents = get(wikiConn, cats[i]);
    _.each(parents, function(parent) {
      if(_.indexOf(cats, parent) === -1) {
        cats.push(parent);
      }
    });
  }

  var len3 = cats.length;
  for(var i=len2;i<len3;i++) {
    parents = get(wikiConn, cats[i]);
    _.each(parents, function(parent) {
      if(_.indexOf(cats, parent) === -1) {
        cats.push(parent);
      }
    });
  }

  return cats;
}

function insertFc(rcConn, wikiConn, rcId, pageId) {
  var result = rcConn.querySync("select fc_rc_id from filteredchanges where fc_rc_id = " + rcId);
  var rows = result.fetchAllSync();
  if(rows.length === 0) {
    _.each(categories(wikiConn, pageId), function(cat_id) {
      rcConn.querySync("insert into filteredchanges(fc_rc_id, fc_cat_id)" +
           " values(" + rcId + "," + cat_id + ")"
      );
    });
  }
}

function insertNotification(rcConn, rcId, user, talkTitle) {
  rcConn.querySync("insert into notification(ntf_user, ntf_talk_title, ntf_rc_id)" +
       " values('" + user + "','" + talkTitle + "'," + rcId + ")");
}

function getArticle(lang, talkTitle, callback) {
  var lang = lang || 'zh',
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
        log(body);
        var data = JSON.parse(body);
        for(var pageId in data.query.pages) {
          if(pageId > 0) {
            var page = data.query.pages[pageId];
            subjectid = page.subjectid;
            log("subjectId(" + subjectid + ") for talk: " + lang + ":" + talkTitle);
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

function notifyParticipant(lang, talkTitle, callback) {
  var lang = lang || 'zh',
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
            log("revisions for talk: " + lang + ":" + talkTitle);
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

function dispatchTalk(lang, rcConn, wikiConn) {
  var result = rcConn.querySync("select rc_id, rc_title from recentchanges where rc_ns=1 and rc_handled=0 limit 1");
  var rows = result.fetchAllSync();
  var rcId, talkTitle;
  if(rows.length > 0) {
    rcId = rows[0].rc_id;
    talkTitle = rows[0].rc_title;

    getArticle(lang, talkTitle, function(pageId) {
      insertFc(rcConn, wikiConn, rcId, pageId);
      result = rcConn.querySync("update recentchanges set rc_handled = 1 where rc_id =" + rcId);
      log("rc(" + rcId + ") had been handled.");
    });

    notifyParticipant(lang, talkTitle, function(participants) {
      _.each(participants, function(participant) {
        insertNotification(rcConn, rcId, participant.user, talkTitle);
      });
    });
  }
}

exports.start = function(settings, lang) {
  _.extend(env, settings);
  if(_.indexOf(env.rc.supported, lang) == -1) throw 'unsuported lang: ' + lang;

  log("setup wikidb connections for " + lang);
  var wikiConn = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.wiki);
  log("setup rcdb connections for " + lang);
  var rcConn = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.rc);

  var dispatch = function() {
    dispatchTalk(lang, rcConn, wikiConn);
  };
  setInterval(dispatch, env.rc[lang].intervals.dispatch);
}

