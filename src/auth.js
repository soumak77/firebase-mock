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

function MockAuthentication(path, data, parent, name) {
  this.path = path || 'Mock://';
  this.errs = {};
  this.priority = null;
  this.myName = parent ? name : extractName(path);
  this.key = this.myName;
  this.flushDelay = parent ? parent.flushDelay : false;
  this.queue = parent ? parent.queue : new Queue();
  this._events = {
    value: [],
    child_added: [],
    child_removed: [],
    child_changed: [],
    child_moved: []
  };
  this.parent = parent || null;
  this.children = {};
  if (parent) parent.children[this.key] = this;
  this.sortedDataKeys = [];
  this.data = null;
  this._lastAutoId = null;
  _.extend(this, Auth.prototype, new Auth());
}

var getServerTime, defaultClock;
getServerTime = defaultClock = function () {
  return new Date().getTime();
};

MockAuthentication.setClock = function (fn) {
  getServerTime = fn;
};

MockAuthentication.restoreClock = function () {
  getServerTime = defaultClock;
};

MockAuthentication.defaultAutoId = function () {
  return autoId(new Date().getTime());
};

MockAuthentication.autoId = MockAuthentication.defaultAutoId;

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

MockAuthentication.prototype.forceCancel = function (error, event, callback, context) {
  var self = this;
  var events = this._events;
  (event ? [event] : _.keys(events))
    .forEach(function (eventName) {
      events[eventName]
        .filter(function (parts) {
          return !event || !callback || (callback === parts[0] && context === parts[1]);
        })
        .forEach(function (parts) {
          parts[2].call(parts[1], error);
          self.off(event, callback, context);
        });
    });
};

MockAuthentication.prototype.fakeEvent = function (event, key, data, prevChild, priority) {
  validate.event(event);
  if (arguments.length < 5) priority = null;
  if (arguments.length < 4) prevChild = null;
  if (arguments.length < 3) data = null;
  var ref = event === 'value' ? this : this.child(key);
  var snapshot = new Snapshot(ref, data, priority);
  this._defer('fakeEvent', _.toArray(arguments), function () {
    this._events[event]
      .map(function (parts) {
        return {
          fn: parts[0],
          args: [snapshot],
          context: parts[1]
        };
      })
      .forEach(function (data) {
        if ('child_added' === event || 'child_moved' === event) {
          data.args.push(prevChild);
        }
        data.fn.apply(data.context, data.args);
      });
  });
  return this;
};

MockAuthentication.prototype.toString = function () {
  return this.path;
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
