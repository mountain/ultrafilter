require('../../lib/underscore');

var sys = require('sys');

var utf8 = require('../../lib/utf8');
var cat  = require("./category"),
    sql  = require("../minimal/sql"),
    util = require('./util');

function insertFc(env, rcId, pageId) {
  env.rcConn.querySync("select fc_rc_id from filteredchanges where fc_rc_id = " + rcId,
    function(result) {
        result.fetchAllSync(function(rows) {
          if(rows.length === 0) {
            categories = cat.categories(env, pageId);
            _.each(categories, function(cat_id) {
              env.rcConn.querySync("insert into filteredchanges(fc_rc_id, fc_cat_id)" +
                   " values(" + rcId + "," + cat_id + ")"
              );
            });
          }
        });
    }
  );
}

function populateCat(env) {
  env.rcConn.querySync("select rc_id, rc_page_id from recentchanges where rc_ns=0 and rc_handled=0 limit 1",
    function(result) {
      result.fetchAllSync(function(rows) {
        var rcId, pageId;
        if(rows.length > 0) {
          rcId = rows[0].rc_id;
          pageId = rows[0].rc_page_id;
          insertFc(env, rcId, pageId);
        }
        if(rcId) {
          env.rcConn.querySync("update recentchanges set rc_handled = 1 where rc_id =" + rcId,
            function(result) {
                util.log("rc(" + rcId + ") had been handled.");
            }
          );
        }
      });
    }
  );
}

exports.start = function(settings, lang) {
  _.extend(env, settings);
  if(_.indexOf(env.rc.supported, lang) == -1) throw 'unsuported lang: ' + lang;

  util.log("setup wikidb connections for " + lang);
  env.wikiConn = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.wiki);
  util.log("setup rcdb connections for " + lang);
  env.rcConn = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.rc);

  var populate = function() {
    populateCat(env);
  };
  setInterval(populate, env.rc[lang].intervals.populate);
}

