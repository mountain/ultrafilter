require('../lib/underscore');

var sys = require('sys');

var utf8  = require('../lib/utf8');
var sql   = require("../vendors/ultrafilter/sql"),
    util  = require('../vendors/ultrafilter/util'),
    util2 = require('../vendors/minimal/util');

var wikiConns = {};

function setupConns(env, lang) {
  util.log("setup wikidb connections for " + lang);
  wikiConns[lang] = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.wiki);
}

exports.app = function(env) {

  _.each(env.supported, function(lang) { setupConns(env, lang); } );

  return function(req, res, variant, name) {
    name = utf8.decode(unescape(name));
    var lang = env.services.variants[variant] || variant,
        cache = env.cache,
        wikiConn = wikiConns[lang];

    //util.log("handle request for " + variant+ ":" + name);
    util.cachedEntry(cache, 'catTitle2Id', name, wikiConn, "select cat_id from category where cat_title = '" + name + "'",
      function(rows) {
        if(rows.length === 0) {
          res.writeHead(404, {});
        } else {
          var catId = rows[0].cat_id;
          util.cachedEntry(cache, 'catId2Children', catId, wikiConn, "select distinct(cat_from) from catgraph where cat_to = " + catId,
            function(children) {
              var subcategories = [];
              _.each(children, function(child) {
                var childId = child.cat_from;
                util.cachedEntrySync(cache, 'catId2Title', childId, wikiConn, "select cat_title from category where cat_id = " + childId,
                  function(cats) {
                    if(cats.length > 0) {
                      subcategories.push(cats[0].cat_title);
                    }
                  }
                );
              });
              res.simpleJson(200, subcategories);
            }
          );
        }
      }
    );
  };
};


