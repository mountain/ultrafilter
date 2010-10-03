#!/usr/bin/env node

var fs = require('fs'),
populate = require('../vendors/minimal/populate-cat'),
sys = require('sys');

var arg = process.argv[1],
    len = arg.length,
    path = arg.substring(0, len - 'scripts/populate.js'.length);

sys.puts("start populate at " + path)

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

    var lang = process.argv[3] || 'zh';
    populate.start(settings, lang);
});

