require('../../lib/underscore');

var sys = require('sys');

exports.log = function() {
    sys.print((new Date()).toUTCString() + " - ");
    sys.puts(_.toArray(arguments).join(" "));
};

exports.throwerr = function(err) {
  if(err) throw err;
};

exports.cachedEntry = function(cache, prefix, key, conn, sql, callback) {
  var id = prefix + ":" + key;
  var entry = cache.getItem(id);
  if(entry) {
    callback(entry);
  } else {
    var cb = function(rows) {
      callback(rows);
      cache.setItem(id, rows);
    };
    conn.queryFetch(sql, cb)
  }
}

exports.cachedEntrySync = function(cache, prefix, key, conn, sql, callback) {
  var id = prefix + ":" + key;
  var entry = cache.getItem(id);
  if(entry) {
    callback(entry);
  } else {
    var cb = function(rows) {
      callback(rows);
      cache.setItem(id, rows);
    };
    conn.queryFetchSync(sql, cb)
  }
}

