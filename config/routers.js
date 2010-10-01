exports.routers = {
  main: new RegExp("^/$"),
  shorturl: new RegExp("^/s/([a-z]*)$"),
  redirect: new RegExp("^/r/([a-z]+)/([0-9a-z]+)$"),
  recentchanges: new RegExp("^/rc/([a-z]+)/((%[0-9a-fA-F]{2})+)((/[0-9]+){0,1})$"),
  'api-rc': new RegExp("^/api/rc/([a-z]+)/((%[0-9a-fA-F]{2})+)/([0-9]+)$"),
  'api-cat-parents': new RegExp("^/api/cat/([a-z]+)/((%[0-9a-fA-F]{2})+)/parents$"),
  'api-cat-children': new RegExp("^/api/cat/([a-z]+)/((%[0-9a-fA-F]{2})+)/children$"),
};
