// This file was automatically generated from test.soy.
// Please don't edit this file by hand.

if (typeof test == 'undefined') { var test = {}; }


test.helloworld = function(opt_data, opt_ignored) {
  return 'Hello test script!';
};


test.helloyou = function(opt_data, opt_ignored) {
  return 'Hello ' + soy.$$escapeHtml(opt_data.name) + '. How are you?';
};
