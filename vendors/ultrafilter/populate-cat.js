require('../../lib/underscore');

var sys = require('sys');

var utf8 = require('../../lib/utf8');
var sql = require("./sql");

var cacheSize = 10000;
cache = new (require('../../lib/cache').Cache)(cacheSize);
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

function populateCat(rcConn, wikiConn) {
  var result = rcConn.querySync("select rc_id, rc_page_id from recentchanges where rc_ns=0 and rc_handled=0 limit 1");
  var rows = result.fetchAllSync();
  var rcId, pageId;
  if(rows.length > 0) {
    rcId = rows[0].rc_id;
    pageId = rows[0].rc_page_id;
    insertFc(rcConn, wikiConn, rcId, pageId);
  }
  result.freeSync();
  if(rcId) {
    result = rcConn.querySync("update recentchanges set rc_handled = 1 where rc_id =" + rcId);
    log("rc(" + rcId + ") had been handled.");
  }
}

exports.start = function(settings, lang) {
  _.extend(env, settings);
  if(_.indexOf(env.rc.supported, lang) == -1) throw 'unsuported lang: ' + lang;

  log("setup wikidb connections for " + lang);
  var wikiConn = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.wiki);
  log("setup rcdb connections for " + lang);
  var rcConn = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.rc);

  var populate = function() {
    populateCat(rcConn, wikiConn);
  };
  setInterval(populate, env.rc[lang].intervals.populate);
}

