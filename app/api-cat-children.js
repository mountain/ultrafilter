require('../lib/underscore');

var sys = require('sys');

var utf8  = require('../lib/utf8');
var sql   = require("../vendors/minimal/sql"),
    util  = require('../vendors/ultrafilter/util'),
    html = require('../vendors/minimal/html');

exports.app = function(env) {

  return function(req, res, variant, name) {
    name = utf8.decode(unescape(name));
    var lang = env.services.variants[variant] || variant,
        cache = env.cache,
        wikiConn = env.conns[lang + '-wiki'];

    var query = require('url').parse(req.url, true).query,
    jsonp = query?(query.callback || query.jsonp):undefined;

    //util.log("handle request for " + variant+ ":" + name);
    util.cachedDbEntry(cache, 'catTitle2Id', name, wikiConn, "select cat_id from category where cat_title = '" + name + "'",
      function(rows) {
        if(rows.length === 0) {
          res.writeHead(404, {});
        } else {
          var catId = rows[0].cat_id;
          util.cachedDbEntry(cache, 'catId2Children', catId, wikiConn, "select distinct(cat_from) from catgraph where cat_to = " + catId,
            function(children) {
              var subcategories = [];
              _.each(children, function(child) {
                var childId = child.cat_from;
                util.cachedDbEntrySync(cache, 'catId2Title', childId, wikiConn, "select cat_title from category where cat_id = " + childId,
                  function(cats) {
                    if(cats.length > 0) {
                      subcategories.push(cats[0].cat_title);
                    }
                  }
                );
              });
              if(jsonp)
                res.simpleJsonp(200, subcategories, jsonp);
              else
                res.simpleJson(200, subcategories);
            }
          );
        }
      }
    );
  };
};


