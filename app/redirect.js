var util = require('../vendors/ultrafilter/util'),
    sys  = require('sys');

exports.app = function(env) {
  var problem = env.templates['problem'],
      cache = env.cache,
      admin = env.admin,
      msg = env.i18n.msg;

  return function(req, res, lang, title) {
    var lang = lang || 'en',
        pageId = parseInt(title.toLowerCase(), 36),
        host = lang + '.wikipedia.org';

    var url = cache?cache.getItem(lang + ':' + pageId):undefined;

    if(url) {
      res.redirect(url);
      env.logger('cache get: (' + lang + ':' + pageId + ')');
      env.logger('cache stats: (hits ' + cache.stats.hits + ', misses ' + cache.stats.misses + ')');
    } else {
      var http = require('http'),
          wp = http.createClient(80, host),
          request = wp.request('GET',
            '/w/api.php?action=query&prop=info&inprop=url&format=json&callback=?&pageids=' + pageId,
            {
              'host': host,
              'User-Agent': 'WikipediaShorturl/' + admin
            }
          );
      request.end();

      request.on('response', function (response) {
        response.setEncoding('utf-8');
        response.on('data', function (chunk) {
          try {
            chunk = chunk.toString('utf8');
            chunk = chunk.substring(1, chunk.length - 1);
            var data = JSON.parse(chunk);
            for(var pageId in data.query.pages) {
              if(pageId > 0) {
                var page = data.query.pages[pageId];
                url = page.fullurl;
                break;
              }
            }
          } catch (e) {
            env.logger('error when parsing json: ' + e);
          }
          if(url) {
            cache.setItem(lang + ':' + pageId, url);
            env.logger('cache put: (' + lang + ':' + pageId + ')');
            env.logger('cache stats: (hits ' + cache.stats.hits + ', misses ' + cache.stats.misses + ')');
            res.redirect(url);
          } else {
            var dir = util.htmlDir(env, lang);
            var html = problem({lang: lang, msg: msg, dir: dir});
            res.simpleHtml(200, html);
          }
        });
      });
    }

  };
}


