'use strict';

var _ = require('lodash');

function FlushQueue () {
  this.events = [];
}

FlushQueue.prototype.push = function () {
  this.events.push.apply(this.events, [].slice.call(arguments).map(function (event) {
    if (typeof event === 'function') {
      event = {
        fn: event
      };
    }
    return new FlushEvent(event.fn, event.context, event.sourceData);
  }));
};

FlushQueue.prototype.flush = function (delay) {
  if (!this.events.length) {
    throw new Error('No deferred tasks to be flushed');
  }
  var events = this.events;
  this.events = [];
  function process () {
    events
      .filter(function (event) {
        return !event.hasRun;
      })
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
  this.canceled = false;
  this.hasRun = false;
  this.fn = fn;
  this.context = context;
  // stores data about the event so that we can filter items in the queue
  this.sourceData = sourceData;
}

FlushEvent.prototype.run = function () {
  if (this.hasRun) {
    throw new Error('cannot call event.run() multiple times');
  }
  if (this.canceled) return;
  this.hasRun = true;
  this.fn.call(this.context);
};

FlushEvent.prototype.cancel = function () {
  if (this.hasRun) {
    throw new Error('cannot call event.cancel() after event.run()');
  }
  this.canceled = true;
};

exports.Queue = FlushQueue;
exports.Event = FlushEvent;