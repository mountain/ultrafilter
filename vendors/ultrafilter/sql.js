var sqlclient = require("../libmysqlclient/mysql-libmysqlclient");

var util = require('./util');

function PseudoConn(host, user, pwd, db, port) {
  this.config = {
    host: host,
    user: user,
    pwd: pwd,
    db:db,
    port: port,
  };
  this.connect();
}

PseudoConn.prototype.connect = function() {
  var conf = this.config;
  this.conn = sqlclient.createConnectionSync(conf.host, conf.user, conf.pwd, conf.db, conf.port);
  this.conn.querySync("SET character_set_client = utf8");
  this.conn.querySync("SET character_set_results = utf8");
  this.conn.querySync("SET character_set_connection = utf8");
};

PseudoConn.prototype.query = function(sql, callback, errback) {
  var result = this.conn.querySync(sql);
  if(result) {
    if(callback) {
      callback(result);
      result.freeSync();
    }
  } else {
    if(errback) errback();
  }
}

exports.connect = function(host, user, pwd, db, port) {
  var pconn =  new PseudoConn(host, user, pwd, db, port);

  var check = function() {
    pconn.query("select 1", function(result) {
      util.log("check connection and keep alive.");
    },
    function() {
      pconn.connect();
      util.log("reconnect to db.");
    });
  };
  setInterval(check, 60*1000);

  return pconn;
};

