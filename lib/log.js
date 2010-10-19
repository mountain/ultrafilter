require('../underscore/underscore');

var sys = require('sys');

var logger = exports.logger = {};

var levels = {DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3}, curLevel = level.INFO;
_.extend(logger, levels);

logger.log = function(level, args) {
    if(level >= curLevel) {
      sys.print((new Date()).toUTCString() + ": ");
      sys.puts(_.toArray(args).join(" "));
    }
};

logger.level = function(l) {
    curLevel = l;
};

logger.debug = function(/* arguments */) {
    logger.log(levels.DEBUG, arguments);
};

logger.info = function(/* arguments */) {
    logger.log(levels.INFO, arguments);
};

logger.warn = function(/* arguments */) {
    logger.log(levels.WARN, arguments);
};

logger.error = function(/* arguments */) {
    logger.log(levels.ERROR, arguments);
};

