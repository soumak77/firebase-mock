'use strict';

var _ = require('./lodash');
var assert = require('assert');
var Promise = require('rsvp').Promise;
var autoId = require('firebase-auto-ids');
var Query = require('./query');
var Snapshot = require('./snapshot');
var Queue = require('./queue').Queue;
var utils = require('./utils');
var Auth = require('./firebase-auth');
var validate = require('./validators');

function MockAuthentication(path) {
  this.path = path || 'Mock://';
  this.errs = {};
  this.flushDelay = false;
  this.queue = new Queue();
  _.extend(this, Auth.prototype, new Auth());
}

MockAuthentication.prototype.flush = function (delay) {
  this.queue.flush(delay);
  return this;
};

MockAuthentication.prototype.autoFlush = function (delay) {
  if (_.isUndefined(delay)) {
    delay = true;
  }
  if (this.flushDelay !== delay) {
    this.flushDelay = delay;
    _.forEach(this.children, function (child) {
      child.autoFlush(delay);
    });
    if (this.parent) {
      this.parent.autoFlush(delay);
    }
  }
  return this;
};

MockAuthentication.prototype.getFlushQueue = function () {
  return this.queue.getEvents();
};

MockAuthentication.prototype.failNext = function (methodName, err) {
  assert(err instanceof Error, 'err must be an "Error" object');
  this.errs[methodName] = err;
};

MockAuthentication.prototype._nextErr = function (type) {
  var err = this.errs[type];
  delete this.errs[type];
  return err || null;
};

MockAuthentication.prototype._defer = function (sourceMethod, sourceArgs, callback) {
  this.queue.push({
    fn: callback,
    context: this,
    sourceData: {
      ref: this,
      method: sourceMethod,
      args: sourceArgs
    }
  });
  if (this.flushDelay !== false) {
    this.flush(this.flushDelay);
  }
};

function extractName(path) {
  return ((path || '').match(/\/([^.$\[\]#\/]+)$/) || [null, null])[1];
}

module.exports = MockAuthentication;
