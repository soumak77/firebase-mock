'use strict';

var _ = require('lodash');

function FlushQueue () {
  this.events = [];
}

FlushQueue.prototype.add = function(args) {
  this.events.push(args);
};

FlushQueue.prototype.flush = function (delay) {
  if (!this.events.length) return;
  var list = this.events;
  this.events = [];
  function process () {
    list.forEach(function(parts) {
      parts[0].apply(null, parts.slice(1));
    });
  }
  if (_.isNumber(delay)) {
    setTimeout(process, delay);
  }
  else {
    process();
  }
};

module.exports = FlushQueue;
