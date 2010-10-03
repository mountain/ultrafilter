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
    _.each(cat.categories(env, pageId), function(cat_id) {
      env.rcConn.querySync("insert into filteredchanges(fc_rc_id, fc_cat_id)" +
           " values(" + rcId + "," + cat_id + ")"
      );
    });
  }
}

function populateCat(env) {
  var result = env.rcConn.querySync("select rc_id, rc_page_id from recentchanges where rc_ns=0 and rc_handled=0 limit 1");
  var rows = result.fetchAllSync();
  var rcId, pageId;
  if(rows.length > 0) {
    rcId = rows[0].rc_id;
    pageId = rows[0].rc_page_id;
    insertFc(env, rcId, pageId);
  }
  result.freeSync();
  if(rcId) {
    result = env.rcConn.querySync("update recentchanges set rc_handled = 1 where rc_id =" + rcId);
    log("rc(" + rcId + ") had been handled.");
  }
}

exports.start = function(settings, lang) {
  _.extend(env, settings);
  if(_.indexOf(env.rc.supported, lang) == -1) throw 'unsuported lang: ' + lang;

  log("setup wikidb connections for " + lang);
  env.wikiConn = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.wiki);
  log("setup rcdb connections for " + lang);
  env.rcConn = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.rc);

  var populate = function() {
    populateCat(env);
  };
  setInterval(populate, env.rc[lang].intervals.populate);
}

