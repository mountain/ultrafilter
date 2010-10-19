require('../../lib/underscore');
require('../../lib/log');

var sql = require('./sql');

exports.init = function (callback, env, filter) {
    env.conns = {};
    _(env.db).chain().keys()
    .select(filter || function() { return true; } )
    .each(function (key) {
        var url = env.db[key], dbType = url.split(':')[0];
        if (dbType === 'mysql') {
            env.conns[key] = sql.connectByUrl(url);
        }
    });
    callback();
};
