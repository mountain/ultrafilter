require('../../lib/underscore');

var sys = require('sys');

exports.log = function() {
    sys.print((new Date()).toUTCString() + " - ");
    sys.puts(_.toArray(arguments).join(" "));
};

exports.throwerr = function(err) {
  if(err) throw err;
};

