'use strict';

var _ = require('lodash');

function FlushQueue () {
  this.events = [];
}

FlushQueue.prototype.push = function(args) {
  this.events.push(args);
};

FlushQueue.prototype.flush = function (delay) {
  if (!this.events.length) {
    throw new Error('No deferred tasks to be flushed');
  }
  var events = this.events;
  this.events = [];
  function process () {
    events.forEach(function(event) {
      event();
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
