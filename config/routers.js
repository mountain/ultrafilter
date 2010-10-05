exports.routers = {
  main: new RegExp("^/$"),
  redirect: new RegExp("^/r/([a-z-]+)/([0-9a-z]+)$"),
  home: new RegExp("^/([a-z-]*)$"),
  shorturl: new RegExp("^/([a-z-]*)/s$"),
  recentchanges: new RegExp("^/([a-z-]+)/rc$"),
  categorychanges: new RegExp("^/([a-z-]+)/rc/((%[0-9a-fA-F]{2})+)((/[0-9]+){0,1})$"),
  notifications: new RegExp("^/([a-z-]+)/n$"),
  userdiscussions: new RegExp("^/([a-z-]+)/n/(.*)$"),
  'api-rc': new RegExp("^/api/rc/([a-z]+)/((%[0-9a-fA-F]{2})+)/([0-9]+)$"),
  'api-cat-parents': new RegExp("^/api/cat/([a-z]+)/((%[0-9a-fA-F]{2})+)/parents$"),
  'api-cat-children': new RegExp("^/api/cat/([a-z]+)/((%[0-9a-fA-F]{2})+)/children$"),
};
