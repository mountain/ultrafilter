#!/usr/bin/env node

require('../lib/log');

var fs       = require('fs'),
    sys      = require('sys'),
    dispatch = require('../vendors/ultrafilter/dispatch-talk')

var arg = process.argv[1],
    len = arg.length,
    path = arg.substring(0, len - 'scripts/dispatch.js'.length),
    lang = process.argv[2] || 'zh';

logger.info("start dispatch at " + path)

dispatch.start(lang, path);

