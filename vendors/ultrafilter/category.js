function get(env, catId) {
  var cats = env.cache.getItem('c' + catId);
  if(!cats) {
    cats = [];
    env.wikiConn.query("select distinct(cat_to) from catgraph where cat_from = " + catId,
    function(result) {
      rows = result.fetchAllSync();
      _.each(rows, function(row) {
        var cat_to = row.cat_to;
        if(_.indexOf(cats, cat_to) === -1) {
          cats.push(cat_to);
        }
      });
      env.cache.setItem('c' + catId, cats);
    });
  }
  return cats;
}

exports.categories = function(env, pageId) {
  var cats = [], mark = 0;

  env.wikiConn.query("select distinct(cat_to) from catgraph where page_from = " + pageId,
  function(result) {
    var rows = result.fetchAllSync();
    _.each(rows, function(row) {
        cats.push(row.cat_to)
    });
  });

  var len = cats.length;
  for(var i=0;i<len;i++) {
    parents = get(env, cats[i]);
    _.each(parents, function(parent) {
      if(_.indexOf(cats, parent) === -1) {
        cats.push(parent);
      }
    });
  }

  var len2 = cats.length;
  for(var i=len;i<len2;i++) {
    parents = get(env, cats[i]);
    _.each(parents, function(parent) {
      if(_.indexOf(cats, parent) === -1) {
        cats.push(parent);
      }
    });
  }

  var len3 = cats.length;
  for(var i=len2;i<len3;i++) {
    parents = get(env, cats[i]);
    _.each(parents, function(parent) {
      if(_.indexOf(cats, parent) === -1) {
        cats.push(parent);
      }
    });
  }

  return cats;
}

