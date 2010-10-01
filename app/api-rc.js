require('../lib/underscore');

var sys = require('sys');

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

function decode(utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;
    while ( i < utftext.length ) {
      c = utftext.charCodeAt(i);
      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      }
      else if((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i+1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      }
      else {
        c2 = utftext.charCodeAt(i+1);
        c3 = utftext.charCodeAt(i+2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }
    }
    return string;
}

function sqlTime(time) {
  return "'" + time.getUTCFullYear() + "-" + (time.getUTCMonth() + 1) + "-" + time.getUTCDate() +
  " " + time.getUTCHours() + ":" + time.getUTCMinutes() + ":" + time.getUTCSeconds() + "'" ;
}

exports.app = function(env) {

  _.each(env.supported, function(lang) { setupConns(env, lang); } );

  var perpage = 50;
  return function(req, res, lang, name, noop, time) {
    name = decode(unescape(name));
    if(time) {
      time = new Date(parseInt(time));
    } else {
      time = new Date(new Date().getTime() - 30*24*60*60*1000);
    }

    log("handle request for " + lang + ":" + name + ":" + time);
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
      var rcConn = rcConns[lang];
      var result = rcConn.querySync("select rc.rc_title, rc.rc_page_id, rc.rc_timestamp from filteredchanges as fc, recentchanges as rc where fc.fc_rc_id = rc.rc_id and fc.fc_cat_id = " + catId + " and rc.rc_timestamp > " + sqlTime(time) + " order by rc.rc_timestamp desc limit 100");
      var rows = [], rc = [];
      if(result) rows = result.fetchAllSync();
      if(result) result.freeSync();
      _.each(rows, function(row) {
          rc.push({
            title: row.rc_title,
            pageId: row.rc_page_id,
            timestamp: row.rc_timestamp,
          });
      });
      res.simpleJson(200, rc);
    }
    return;
  };
};


