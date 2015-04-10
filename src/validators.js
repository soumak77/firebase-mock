'use strict';

var assert = require('assert');
var format = require('util').format;

var events = ['value', 'child_added', 'child_removed', 'child_changed', 'child_moved'];
exports.event = function (name) {
  assert(events.indexOf(name) > -1, format('"%s" is not a valid event, must be: %s', name, events.map(function (event) {
    return format('"%s"', event);
  }).join(', ')));
};
