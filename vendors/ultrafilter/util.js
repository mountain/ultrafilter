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

exports.refUser = function(referer, lang, varaint) {
  var user = undefined,
      url = require('url').parse(referer),
      source = 'http://' + lang + ".wikipedia.org";
  variant = variant || lang;
  if(url.href.substring(0, source.length) === source) {
    var path = ulr.pathname.split('/');
    if(path.length === 3 && (path[0] === 'wiki' || path[0] === variant) &&
      path[1].substring(0, 4) === 'User:' && path[2] === 'Ultrafilter') {
      user = path[1].substring(4);
    }
  }
  return user;
}


exports.markAccess = function(rcConn, user, type) {
  if(!user) return;
  rcConn.query("insert into access(ac_user, ac_type, ac_timestamp) values('" + user + "', '" + type +"', current_timestamp) on duplicate key update ac_timestamp=current_timestamp;");
}

