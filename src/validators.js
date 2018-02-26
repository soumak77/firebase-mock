'use strict';

var assert = require('assert');
var format = require('util').format;
var findUndefinedProperties = require('./utils').findUndefinedProperties;

var events = ['value', 'child_added', 'child_removed', 'child_changed', 'child_moved'];
exports.event = function (name) {
  assert(events.indexOf(name) > -1, format('"%s" is not a valid event, must be: %s', name, events.map(function (event) {
    return format('"%s"', event);
  }).join(', ')));
};

exports.data = function(obj){
  assert(obj !== undefined, 'Data is undefined');
  var undefinedProperties = findUndefinedProperties(obj);
  assert(undefinedProperties.length === 0, 'Data contains undefined properties at ' + undefinedProperties);
};