#!/usr/bin/env node

require('../lib/log');

var fs    = require('fs'),
    sys   = require('sys'),
    fetch = require('../vendors/ultrafilter/fetch-rc');

var arg  = process.argv[1],
    len  = arg.length,
    path = arg.substring(0, len - 'scripts/fetch.js'.length),
    lang = process.argv[2] || 'zh';

logger.info("start fetch " + lang + " at " + path)

fetch.start(lang, path);

