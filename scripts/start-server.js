#!/usr/bin/env node

var fs = require('fs'),
server = require('../vendors/ultrafilter/server'),
sys = require('sys');

var ultrafilter = process.argv[1],
    len = ultrafilter.length,
    path = ultrafilter.substring(0, len - 23);

sys.puts("start ultrafilter at " + path);

fs.readFile(process.argv[2] || path + 'settings.json', function(err, data) {
    var settings = {};

    if (err) {
      sys.puts('No settings.json found ('+err+'). Using default settings');
    } else {
      try {
        settings = JSON.parse(data.toString('utf8',0,data.length));
        settings.path = path;
      } catch (e) {
        sys.puts('Error parsing settings.json: '+e);
        process.exit(1);
      }
    }

    if(!settings.admin) {
      sys.puts('email address of administrator was not setted!');
      process.exit(1);
    }

    server.start(settings);
});

