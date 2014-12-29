'use strict';

var _ = require('lodash');

function FlushQueue () {
  this.events = [];
}

FlushQueue.prototype.push = function(fn, context, sourceData) {
  this.events.push(new FlushEvent(fn, context, sourceData));
};

FlushQueue.prototype.flush = function (delay) {
  if (!this.events.length) {
    throw new Error('No deferred tasks to be flushed');
  }
  var list = this.events;
  this.events = [];
  function process () {
    list.forEach(function(flushEvent) {
      if( !flushEvent.alreadyRun ) {
        flushEvent.run();
      }
    });
  }
  if (_.isNumber(delay)) {
    setTimeout(process, delay);
  }
  else {
    process();
  }
};

FlushQueue.prototype.getEvents = function() {
  return this.events.slice();
};

function FlushEvent(fn, context, sourceData) {
  this.canceled = false;
  this.alreadyRun = false;
  this.fn = fn;
  this.ctx = context;
  // stores data about the event so that we can filter items in the queue
  this.sourceData = sourceData;
}

FlushEvent.prototype.run = function() {
  if( this.alreadyRun ) { throw new Error('This FlushEvent was already run and cannot be invoked again'); }
  if( this.canceled ) { return; }
  this.alreadyRun = true;
  this.fn.call(this.ctx);
};

FlushEvent.prototype.cancel = function() {
  if( this.alreadyRun ) { throw new Error('This FlushEvent was already run and cannot be canceled'); }
  this.canceled = true;
};

module.exports = FlushQueue;