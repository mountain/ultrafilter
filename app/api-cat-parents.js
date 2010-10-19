require('../lib/underscore');

var sys = require('sys');

var utf8  = require('../lib/utf8');
var sql   = require("../vendors/ultrafilter/sql"),
    util  = require('../vendors/ultrafilter/util'),
    html = require('../vendors/minimal/html');

var wikiConns = {};

function setupConns(env, lang) {
  util.log("setup wikidb connections for " + lang);
  wikiConns[lang] = sql.connect(env['db-host'], env['db-user'], env['db-pwd'], env.rc[lang].db.wiki);
}

exports.app = function(env) {

  _.each(env.supported, function(lang) { setupConns(env, lang); } );

  return function(req, res, variant, name) {
    name = utf8.decode(unescape(name));
    var lang= env.services.variants[variant] || variant,
        cache = env.cache,
        wikiConn = wikiConns[lang];

    var query = require('url').parse(req.url, true).query,
    jsonp = query?(query.callback || query.jsonp):undefined;

    //util.log("handle request for " + variant+ ":" + name);
    util.cachedDbEntry(cache, 'catTitle2Id', name, wikiConn, "select cat_id from category where cat_title = '" + name + "'",
      function(rows) {
        if(rows.length === 0) {
          res.writeHead(404, {});
        } else {
          var catId = rows[0].cat_id;
          util.cachedDbEntry(cache, 'catId2Parents', catId, wikiConn, "select distinct(cat_to) from catgraph where cat_from = " + catId,
            function(parents) {
              var supcategories = [];
              _.each(parents, function(parent) {
                var parentId = parent.cat_to;
                util.cachedDbEntrySync(cache, 'catId2Title', parentId, wikiConn, "select cat_title from category where cat_id = " + parent.cat_to,
                  function(cats) {
                    if(cats.length > 0) {
                      supcategories.push(cats[0].cat_title);
                    }
                  }
                );
              });
              if(jsonp)
                res.simpleJsonp(200, supcategories, jsonp);
              else
                res.simpleJson(200, supcategories);
            }
          );
        }
      }
    );
  };
};


