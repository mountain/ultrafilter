//Shorturl
function s() {
  $("#submit").click(function() {
    var title = $("#query").val();
    if(title && title !== "") {
      var encoded = escape(utf8(title));
      var query = "http://" + lang + ".wikipedia.org/w/api.php?action=query&prop=info&inprop=url&format=json&callback=?&titles=" + encoded;
      $.getJSON(query, function(data) {
        if(!data.query) return;
        for(var pageId in data.query.pages) {
          if(pageId > 0) {
            var shortcut = parseInt(pageId).toString(36),
                url = host + "/r/" + lang + "/" + shortcut;
            var html = "<a id='link' href='" + url + "'>" + title + "</a>:&nbsp;";
            html += "<span id='url'>" + url + "</span>";
            $("#result").html(html);
          } else {
            $("#result").html(notfound);
          }
        }
      });
    };
  });
}

//Recentchanges
function rc() {
  $("#submit").click(function() {
    var title = $("#query").val();
    if(title && title !== "") {
      var encoded = escape(utf8(title));
      window.location = host + "/" + lang + "/rc/" + encoded;
    };
  });
}

//Categorychanges
function cc() {
  var encoded = escape(utf8(category));

  var query = host + "/api/cat/" + lang + "/" + encoded + "/parents";
  $.getJSON(query, function(data) {
    if(!data) return;
    var html = "<h3>" + supcat + "</h3><ul>";
    for(var ind in data) {
      var cat = data[ind];
      html += ("<li><a href='/" + lang + "/rc/" + escape(utf8(cat)) +"'>" + cat + "</a></li>");
    }
    html += ("</ul>");
    $("#supcategory").html(html);
  });
  query = host + "/api/cat/" + lang + "/" + encoded + "/children";
  $.getJSON(query, function(data) {
    if(!data) return;
    var html = "<h3>" + subcat + "</h3><ul>";
    for(var ind in data) {
      var cat = data[ind];
      html += ("<li><a href='/" + lang + "/rc/" + escape(utf8(cat)) +"'>" + cat + "</a></li>");
    }
    html += ("</ul>");
    $("#subcategory").html(html);
  });
}

//Notifications
function n() {
  $("#submit").click(function() {
    var title = $("#query").val();
    if(title && title !== "") {
      var encoded = escape(utf8(title));
      window.location = host + "/" + lang + "/n/" + encoded;
    };
  });
}

function utf8(string) {
  string = string.replace(/\r\n/g,"\n");
  var utftext = "";
  for (var n = 0; n < string.length; n++) {
    var c = string.charCodeAt(n);
    if (c < 128) {
      utftext += String.fromCharCode(c);
    }
    else if((c > 127) && (c < 2048)) {
      utftext += String.fromCharCode((c >> 6) | 192);
      utftext += String.fromCharCode((c & 63) | 128);
    }
    else {
      utftext += String.fromCharCode((c >> 12) | 224);
      utftext += String.fromCharCode(((c >> 6) & 63) | 128);
      utftext += String.fromCharCode((c & 63) | 128);
    }
  }
  return utftext;
}


