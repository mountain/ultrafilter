/**
 *  Add Ultrafilter support
 */

function ultrafilter(cats) {

  function buildHtml(rc) {
    var html = '';
    if(rc.length > 0) {
      var group = 0;
      var date =  rc[0].timestamp.toString().split('T')[0];
      html += ("<h4>" + date + "</h4>");
      html += "<ul>";
      for(var ind in rc) {
        var change = rc[ind], date = change.timestamp.toString().split('T')[0], last;
        var closeOpen = last && (last!==date);
        if(closeOpen) {
          html += ("</ul><h4>" + date + "</h4><ul>");
        }
        var time = change.timestamp.toString().split('T')[1];
        html += ("<li>" + time + "&nbsp;&nbsp;<a href='/wiki/" + change.title + "'>" + change.title + "</a></li>");
        last = date;
      }
      html += "</ul>";
    }
    return html;
  }

  function buildAlert(record) {
    var html = '';
    if(record && (record.ntf>0 || record.rt>0)) {
      html += "<div style='background-color:#F6E3CE'>您有<a href='/wiki/User:" + wgUserName + "/Ultrafilter'>新讨论</a></div>";
    }
    return html;
  }

  function fetchRc(cats) {
      var path = wgPageName.split('/');
      if(wgNamespaceNumber===2 && path[path.length-1]==='Ultrafilter' && cats) {
          var node = $j('#ultrafilter-rc');
          if(node) {
              cats = encodeURIComponent(cats);
              $j.getJSON('http://ultrafilter.org/api/rc/' + wgContentLanguage + '/' + cats + '/0?jsonp=?', function(data) {
                  node.html(buildHtml(data));
              });
          }
      }
  }

  function fetchRt(cats) {
      var path = wgPageName.split('/');
      if(wgNamespaceNumber===2 && path[path.length-1]==='Ultrafilter' && cats) {
          var node = $j('#ultrafilter-rc');
          if(node) {
              cats = encodeURIComponent(cats);
              $j.getJSON('http://ultrafilter.org/api/rc/' + wgContentLanguage + '/' + cats + '/0?jsonp=?', function(data) {
                  node.html(buildHtml(data));
              });
          }
       }
  }

  function fetchNtf() {
      var path = wgPageName.split('/');
      if(wgNamespaceNumber===2 && path[path.length-1]==='Ultrafilter' && wgUserName) {
          var node = $j('#ultrafilter-ntf');
          if(node) {
              var user = encodeURIComponent(wgUserName);
              $j.getJSON('http://ultrafilter.org/api/ntf/' + wgContentLanguage + '/' + user + '/0?jsonp=?', function(data) {
                  node.html(buildHtml(data));
              });
          }
       }
  }

  function ultrafilterAlert(cats) {
      if(wgUserName) {
          var node = $j('#firstHeading');
          if(node) {
              var user = encodeURIComponent(wgUserName);
              cats = encodeURIComponent(cats);
              $j.getJSON('http://ultrafilter.org/api/alt/' + wgContentLanguage + '/' + user + '/' + cats +'?jsonp=?', function(data) {
                  node.after(buildAlert(data));
              });
          }
       }
  }

  fetchRc(cats);
  fetchRt(cats);
  fetchNtf();
  ultrafilterAlert(cats);

}
