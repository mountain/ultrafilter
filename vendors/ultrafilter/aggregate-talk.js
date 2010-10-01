require('../../lib/underscore');

var sys = require('sys');

var sqlclient = require("../libmysqlclient/mysql-libmysqlclient");

var cacheSize = 10000;
cache = new (require('../../lib/cache').Cache)(cacheSize);

function log() {
    sys.print((new Date()).toUTCString() + " - ");
    sys.puts(_.toArray(arguments).join(" "));
}

function createConn(host, user, pwd, db, port) {
    var conn = sqlclient.createConnectionSync(host, user, pwd, db, port);
    conn.querySync("SET character_set_client = utf8");
    conn.querySync("SET character_set_results = utf8");
    conn.querySync("SET character_set_connection = utf8");
    return conn;
}

function get(wiki_conn, catId) {
  var cats = cache['c' + catId];
  if(!cats) {
    cats = [];
    result = wiki_conn.querySync("select distinct(cat_to) from catgraph where cat_from = " + catId);
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

function categories(wiki_conn, pageId) {
  var cats = [], mark = 0;

  var result = wiki_conn.querySync("select distinct(cat_to) from catgraph where page_from = " + pageId);
  var rows = result.fetchAllSync();
  _.each(rows, function(row) {
      cats.push(row.cat_to)
  });
  result.freeSync();

  var len = cats.length;
  for(var i=0;i<len;i++) {
    parents = get(wiki_conn, cats[i]);
    _.each(parents, function(parent) {
      if(_.indexOf(cats, parent) === -1) {
        cats.push(parent);
      }
    });
  }

  var len2 = cats.length;
  for(var i=len;i<len2;i++) {
    parents = get(wiki_conn, cats[i]);
    _.each(parents, function(parent) {
      if(_.indexOf(cats, parent) === -1) {
        cats.push(parent);
      }
    });
  }

  var len3 = cats.length;
  for(var i=len2;i<len3;i++) {
    parents = get(wiki_conn, cats[i]);
    _.each(parents, function(parent) {
      if(_.indexOf(cats, parent) === -1) {
        cats.push(parent);
      }
    });
  }

  return cats;
}

function insertFc(rc_conn, wiki_conn, rcId, pageId) {
  var result = rc_conn.querySync("select fc_rc_id from filteredchanges where fc_rc_id = " + rcId);
  var rows = result.fetchAllSync();
  if(rows.length === 0) {
    _.each(categories(wiki_conn, pageId), function(cat_id) {
      rc_conn.querySync("insert into filteredchanges(fc_rc_id, fc_cat_id)" +
           " values(" + rcId + "," + cat_id + ")"
      );
    });
  }
}

function aggregateTalk(rc_conn, wiki_conn) {
  var result = rc_conn.querySync("select rc_id, rc_page_id from recentchanges where rc_ns=1 and rc_handled=0 limit 1");
  var rows = result.fetchAllSync();
  var rcId, pageId;
  if(rows.length > 0) {
    rcId = rows[0].rc_id;
    pageId = rows[0].rc_page_id;
    insertFc(rc_conn, wiki_conn, rcId, pageId);
  }
  result.freeSync();
  if(rcId) {
    result = rc_conn.querySync("update recentchanges set rc_handled = 1 where rc_id =" + rcId);
    log("rc(" + rcId + ") had been handled.");
  }
}

var env = {
  rc: require('../../config/rc').rc
};

exports.start = function(settings, lang) {
  _.extend(env, settings);
  if(_.indexOf(env.rc.supported, lang) == -1) throw 'unsuported lang: ' + lang;

  log("setup wikidb connections for " + lang);
  var wiki_conn = createConn(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.wiki);
  log("setup rcdb connections for " + lang);
  var rc_conn = createConn(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.rc);

  var aggregate = function() {
    aggregateTalk(rc_conn, wiki_conn);
  };
  setInterval(aggregate, env.rc[lang].intervals.aggregate);
}

