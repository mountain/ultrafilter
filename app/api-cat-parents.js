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

  return function(req, res, lang, name) {
    name = utf8.decode(unescape(name));

    //util.log("handle request for " + lang + ":" + name);
    wikiConn = wikiConns[lang];
    wikiConn.queryFetch("select cat_id from category where cat_title = '" + name + "'",
      function(rows) {
        if(rows.length === 0) {
          res.writeHead(404, {});
        } else {
          var catId = rows[0].cat_id;
          wikiConn.queryFetch("select distinct(cat_to) from catgraph where cat_from = " + catId,
            function(parents) {
              var supcategories = [];
              _.each(parents, function(parent) {
                wikiConn.queryFetchSync("select cat_title from category where cat_id = " + parent.cat_to,
                  function(cats) {
                    supcategories.push(cats[0].cat_title);
                  }
                );
              });
              res.simpleJson(200, supcategories);
            }
          );
        }
      }
    );
  };
};


