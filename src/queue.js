'use strict';

var _            = require('lodash');
var util         = require('util');
var EventEmitter = require('events').EventEmitter;

function FlushQueue () {
  this.events = [];
}

FlushQueue.prototype.push = function () {
  var self = this;
  this.events.push.apply(this.events, _.toArray(arguments).map(function (event) {
    if (typeof event === 'function') {
      event = {
        fn: event
      };
    }
    return new FlushEvent(event.fn, event.context, event.sourceData)
      .once('cancel', function (event) {
        self.events.splice(self.events.indexOf(event), 1);
      });
  }));
};

FlushQueue.prototype.flush = function (delay) {
  if (!this.events.length) {
    throw new Error('No deferred tasks to be flushed');
  }
  var events = this.events;
  events.forEach(function (event) {
    event.removeAllListeners();
  });
  this.events = [];
  function process () {
    events
      .forEach(function (event) {
        event.run();
      });
  }
  if (_.isNumber(delay)) {
    setTimeout(process, delay);
  }
  else {
    process();
  }
};

FlushQueue.prototype.getEvents = function () {
  return this.events.slice();
};

function FlushEvent (fn, context, sourceData) {
  this.fn = fn;
  this.context = context;
  // stores data about the event so that we can filter items in the queue
  this.sourceData = sourceData;

  EventEmitter.call(this);
}

util.inherits(FlushEvent, EventEmitter);

FlushEvent.prototype.run = function () {
  this.cancel();
  this.fn.call(this.context);
};

FlushEvent.prototype.cancel = function () {
  this.emit('cancel', this);
};

exports.Queue = FlushQueue;
exports.Event = FlushEvent;
