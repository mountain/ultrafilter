require('../lib/underscore');

var sys = require('sys');

var utf8 = require('../lib/utf8');
var sqlclient = require("../vendors/libmysqlclient/mysql-libmysqlclient");

var wikiConns = {};
var rcConns = {};

function createConn(host, user, pwd, db, port) {
    var conn = sqlclient.createConnectionSync(host, user, pwd, db, port);
    conn.querySync("SET character_set_client = utf8");
    conn.querySync("SET character_set_results = utf8");
    conn.querySync("SET character_set_connection = utf8");
    return conn;
}

function log() {
    sys.print((new Date()).toUTCString() + " - ");
    sys.puts(_.toArray(arguments).join(" "));
}

function setupConns(env, lang) {
  log("setup wikidb connections for " + lang);
  wikiConns[lang] = createConn(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.wiki);
  log("setup rcdb connections for " + lang);
  rcConns[lang] = createConn(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.rc);
}

exports.app = function(env) {

  var msg = env.i18n.msg;
  var unknown = env.templates['unknown'],
      fc = env.templates['filteredchanges'];

  _.each(env.supported, function(lang) { setupConns(env, lang); } );

  var perpage = 50;
  return function(req, res, lang, name, noop, page) {
    name = utf8.decode(unescape(name));
    if(page) {
      page = page.toString();
      page = parseInt(page.substring(1, page.length));
    } else {
      page = 1;
    }
    page = page || 1;
    page = page - 1;

    log("handle request for " + lang + ":" + name + ":" + page);
    wikiConn = wikiConns[lang];
    var catId;
    var result = wikiConn.querySync("select cat_id from category where cat_title = '" + name + "'");
    var rows = result.fetchAllSync();
    if(rows && rows.length > 0) {
      catId = rows[0].cat_id;
    }
    if(result) result.freeSync();

    if(!catId) {
      var html = unknown({lang: lang, msg: msg});
      res.simpleHtml(200, html);
    } else {
      var result = wikiConn.querySync("select distinct(cat_from) from catgraph where cat_to = " + catId);
      var children = result.fetchAllSync();
      if(result) result.freeSync();

      var subcategories = [];
      _.each(children, function(child) {
        result = wikiConn.querySync("select cat_title from category where cat_id = " + child.cat_from);
        subcategories.push(result.fetchAllSync()[0]);
        if(result) result.freeSync();
      });

      var rcConn = rcConns[lang];

      result = rcConn.querySync("select count(*) as total from filteredchanges where fc_cat_id = " + catId);
      var total = result.fetchAllSync()[0].total, pagenum = total/perpage;
      if(page>=pagenum) page = pagenum - 1;
      if(result) result.freeSync();

      result = rcConn.querySync("select rc.rc_title, rc.rc_page_id, rc.rc_timestamp from filteredchanges as fc, recentchanges as rc where fc.fc_rc_id = rc.rc_id and rc.rc_ns = 0 and fc.fc_cat_id = " + catId + " order by rc.rc_timestamp desc limit " + perpage + " offset " + perpage*page);
      var changes = [];
      if(result) changes = result.fetchAllSync();
      if(result) result.freeSync();

      result = rcConn.querySync("select rc.rc_title, rc.rc_page_id, rc.rc_timestamp from filteredchanges as fc, recentchanges as rc where fc.fc_rc_id = rc.rc_id and rc.rc_ns = 1 and fc.fc_cat_id = " + catId + " order by rc.rc_timestamp desc limit " + perpage);
      var talks = [];
      if(result) talks = result.fetchAllSync();
      if(result) result.freeSync();

      var html = fc({lang: lang, msg: msg, category: name, subcategories:subcategories, changes:changes, pagenum:pagenum, talks: talks, encode:utf8.encode});
      res.simpleHtml(200, html);
    }
    return;
  };
};


