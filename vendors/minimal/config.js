require('../../lib/underscore');

var sys = require('sys');

exports.load = function(env) {
    var fs = require('fs')
        path = env.path + 'config';
    fs.readdir(path, function(err, files) {
        if (err) {
            sys.puts('No config found (' + err + ') at ' + tmpl_path);
        } else {
            _(files).chain().select(
                function(file) { return file.match(/.+\.js$/); }
            ).each(
                function(file) {
                    var name = file.substring(0, file.length - 3);
                    env[name] = require(name).config;
                }
            );
        }
    });
}

