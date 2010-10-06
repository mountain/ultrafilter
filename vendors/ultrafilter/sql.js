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

PseudoConn.prototype.query = function(sql, callback) {
  var pconn = this;
  var callbackWithErr = function(err, results) {
    if(err) {
      util.log("err at query: " + err);
      pconn.check();
    } else {
      try {
        if(callback) callback(new PseudoResult(this, results));
      } catch(e) {
        util.log("err in query callback: " + e);
      }
    }
  };
  this.conn.query(sql, callbackWithErr);
}

PseudoConn.prototype.querySync = function(sql, callback) {
  var pconn = this;
  var results = undefined;
  try {
    results = this.conn.querySync(sql);
  } catch(e) {
    util.log("err at query: " + e);
    pconn.check();
  }
  if(results !== undefined) try {
    if(callback) callback(new PseudoResult(this, results));
    if(results && results !== true) results.freeSync();
  } catch(e) {
    util.log("err in query callback: " + e);
  }
}

PseudoConn.prototype.queryFetch = function(sql, callback) {
  var fetch = function(rows) {
    callback(rows);
  };
  this.query(sql, function(results) {
    results.fetchAll(fetch);
  });
}

PseudoConn.prototype.queryFetchSync = function(sql, callback) {
  var fetch = function(rows) {
    callback(rows);
  };
  this.querySync(sql, function(results) {
    results.fetchAllSync(fetch);
  });
}

PseudoConn.prototype.check = function() {
  this.conn.query("select 1", function(err, results) {
    util.log("check connection and keep alive.");
    if(err) {
      this.connect();
      util.log("reconnect to db.");
    }
  });
}

function PseudoResult(conn, results) {
  this.conn = conn;
  this.results = results;
}

PseudoResult.prototype.fetchAll = function(callback) {
  var pr = this;
  var callbackWithErr = function(err, rows) {
    if(err) {
      util.log("err at fetching: " + err);
      pr.conn.check();
    } else {
      try {
        if(callback) callback(rows);
      } catch(e) {
        util.log("err in fetch callback: " + e);
      }
    }
  };
  this.results.fetchAll(callbackWithErr);
}

PseudoResult.prototype.fetchAllSync = function(callback) {
  var pr = this;
  var rows = undefined;
  try {
    rows = this.results.fetchAllSync();
  } catch(e) {
    util.log("err at fetching: " + e);
    pr.conn.check();
  }
  if(rows !== undefined) try {
    if(callback) callback(rows);
  } catch(e) {
    util.log("err in fetch callback: " + e);
  }
}

exports.connect = function(host, user, pwd, db, port) {
  var pconn =  new PseudoConn(host, user, pwd, db, port);

  var check = function() {
    pconn.conn.query("select 1", function(err, results) {
      util.log("check connection and keep alive.");
      if(err) {
        pconn.connect();
        util.log("reconnect to db.");
      }
    });
  };
  setInterval(check, 60*1000);

  return pconn;
};

