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

  _.each(env.supported, function(lang) { setupConns(env, lang); } );

  var perpage = 50;
  return function(req, res, lang, name) {
    name = utf8.decode(unescape(name));

    log("handle request for " + lang + ":" + name);
    wikiConn = wikiConns[lang];
    var catId;
    var result = wikiConn.querySync("select cat_id from category where cat_title = '" + name + "'");
    var rows = result.fetchAllSync();
    if(rows && rows.length > 0) {
      catId = rows[0].cat_id;
    }
    if(result) result.freeSync();

    if(!catId) {
      res.writeHead(404, {});
    } else {
      var result = wikiConn.querySync("select distinct(cat_to) from catgraph where cat_from = " + catId);
      var children = result.fetchAllSync();
      if(result) result.freeSync();

      var subcategories = [];
      _.each(children, function(child) {
        result = wikiConn.querySync("select cat_title from category where cat_id = " + child.cat_to);
        subcategories.push(result.fetchAllSync()[0].cat_title);
        if(result) result.freeSync();
      });
      res.simpleJson(200, subcategories);
    }
    return;
  };
};


