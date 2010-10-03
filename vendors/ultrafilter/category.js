function get(env, catId) {
  var cats = env.cache.getItem('c' + catId);
  if(!cats) {
    cats = [];
    result = env.wikiConn.querySync("select distinct(cat_to) from catgraph where cat_from = " + catId);
    rows = result.fetchAllSync();
    _.each(rows, function(row) {
      var cat_to = row.cat_to;
      if(_.indexOf(cats, cat_to) === -1) {
        cats.push(cat_to);
      }
    });
    if(result) result.freeSync();
    env.cache.setItem('c' + catId, cats);
  }
  return cats;
}

exports.categories = function(env, pageId) {
  var cats = [], mark = 0;

  var result = env.wikiConn.querySync("select distinct(cat_to) from catgraph where page_from = " + pageId);
  var rows = result.fetchAllSync();
  _.each(rows, function(row) {
      cats.push(row.cat_to)
  });
  result.freeSync();

  var len = cats.length;
  for(var i=0;i<len;i++) {
    parents = get(env.wikiConn, cats[i]);
    _.each(parents, function(parent) {
      if(_.indexOf(cats, parent) === -1) {
        cats.push(parent);
      }
    });
  }

  var len2 = cats.length;
  for(var i=len;i<len2;i++) {
    parents = get(env.wikiConn, cats[i]);
    _.each(parents, function(parent) {
      if(_.indexOf(cats, parent) === -1) {
        cats.push(parent);
      }
    });
  }

  var len3 = cats.length;
  for(var i=len2;i<len3;i++) {
    parents = get(env.wikiConn, cats[i]);
    _.each(parents, function(parent) {
      if(_.indexOf(cats, parent) === -1) {
        cats.push(parent);
      }
    });
  }

  return cats;
}

