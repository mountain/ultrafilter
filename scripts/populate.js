#!/usr/bin/env node

require('../lib/log');

var fs       = require('fs'),
    sys      = require('sys'),
    populate = require('../vendors/ultrafilter/populate-cat');

var arg  = process.argv[1],
    len  = arg.length,
    path = arg.substring(0, len - 'scripts/populate.js'.length),
    lang = process.argv[2] || 'zh';

logger.info("start populate at " + path);

populate.start(lang);

