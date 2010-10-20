require('../../lib/underscore');

var sys = require('sys');

var cc = require('../../lib/cache');

exports.cachedDbEntry = function(cache, prefix, key, conn, sql, callback) {
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

exports.cachedDbEntrySync = function(cache, prefix, key, conn, sql, callback) {
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

exports.refUser = function(referer, lang, variant) {
  var user = undefined,
      url = referer?require('url').parse(referer):undefined,
      source = lang + ".wikipedia.org";
  variant = variant || lang;
  if(url && url.hostname === source) {
    var path = url.pathname.split('/');
    if(path.length >= 3 && (path[1] === 'wiki' || path[1] === variant) &&
      path[2].substring(0, 5) === 'User:' && path[3] === 'Ultrafilter') {
      user = path[2].substring(5);
    }
  }
  return user;
}

exports.markAccess = function(rcConn, user, type) {
  if(!user || !type) return;
  rcConn.query("insert into access(ac_user, ac_type, ac_timestamp) values('" + user + "', '" + type +"', current_timestamp) on duplicate key update ac_timestamp=current_timestamp;");
}

