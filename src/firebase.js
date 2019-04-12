'use strict';

var _ = require('./lodash');
var assert = require('assert');
var Promise = require('rsvp').Promise;
var autoId = require('firebase-auto-ids');
var Query = require('./query');
var Snapshot = require('./snapshot');
var Queue = require('./queue').Queue;
var Timestamp = require('./timestamp');
var utils = require('./utils');
var Auth = require('./firebase-auth');
var validate = require('./validators');

function MockFirebase(path, data, parent, name) {
  this.ref = this;
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
  this.root = this._getRoot();
  this.sortedDataKeys = [];
  this.data = null;
  this._dataChanged(_.cloneDeep(data) || null);
  this._lastAutoId = null;
  _.extend(this, Auth.prototype, new Auth());
}

MockFirebase.ServerValue = {
  TIMESTAMP: {
    '.sv': 'timestamp'
  }
};

MockFirebase.setClock = function (fn) {
  utils.setServerClock(fn);
};

MockFirebase.restoreClock = function () {
  utils.restoreServerClock();
};

MockFirebase.autoId = function () {
  return autoId(new Date().getTime());
};

MockFirebase.prototype.flush = function (delay) {
  this.queue.flush(delay);
  return this;
};

MockFirebase.prototype.autoFlush = function (delay) {
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

MockFirebase.prototype.getFlushQueue = function () {
  return this.queue.getEvents();
};

MockFirebase.prototype.failNext = function (methodName, err) {
  assert(err instanceof Error, 'err must be an "Error" object');
  this.errs[methodName] = err;
};

MockFirebase.prototype.forceCancel = function (error, event, callback, context) {
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

MockFirebase.prototype.getData = function () {
  return _.cloneDeepWith(this.data, render);
};

MockFirebase.prototype.getKeys = function () {
  return this.sortedDataKeys.slice();
};

MockFirebase.prototype.fakeEvent = function (event, key, data, prevChild, priority) {
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

MockFirebase.prototype.toString = function () {
  return this.path;
};

MockFirebase.prototype.child = function (childPath) {
  if (childPath === '/') return this;
  assert(childPath, 'A child path is required');
  var parts = _.compact(childPath.split('/'));
  var childKey = parts.shift();
  var child = this.children[childKey];
  if (!child) {
    child = new MockFirebase(utils.mergePaths(this.path, childKey), this._childData(childKey), this, childKey);
    this.children[child.key] = child;
  }
  if (parts.length) {
    child = child.child(parts.join('/'));
  }
  return child;
};

MockFirebase.prototype.set = function (data, callback) {
  validate.data(data);
  var err = this._nextErr('set');
  data = _.cloneDeep(data);
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('set', _.toArray(arguments), function () {
      if (err === null) {
        data = utils.removeEmptyRtdbProperties(data);
        self._dataChanged(data);
        resolve(data);
      } else {
        if (callback) {
          callback(err);
        }
        reject(err);
      }
    });
  });
};

MockFirebase.prototype.update = function (changes, callback) {
  assert.equal(typeof changes, 'object', 'First argument must be an object when calling "update"');
  validate.data(changes);
  var err = this._nextErr('update');
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('update', _.toArray(arguments), function () {
      if (!err) {
        var base = self.getData();
        var data = _.isPlainObject(base) ? base : {};
        // operate as a multi-set
        _.keys(changes).forEach(function (key) {
          var val = changes[key];
          _.set(data, key.replace(/^\//, '').replace(/\//g, '.'), _.isPlainObject(val) ? utils.updateToRtdbObject(val) : val);
        });
        data = utils.removeEmptyRtdbProperties(data);
        self._dataChanged(data);
        resolve(data);
      } else {
        if (callback) {
          callback(err);
        }
        reject(err);
      }
    });
  });
};

MockFirebase.prototype.setPriority = function (newPriority, callback) {
  var err = this._nextErr('setPriority');
  this._defer('setPriority', _.toArray(arguments), function () {
    this._priChanged(newPriority);
    if (callback) callback(err);
  });
};

MockFirebase.prototype.setWithPriority = function (data, pri, callback) {
  this.setPriority(pri);
  this.set(data, callback);
};

/* istanbul ignore next */
MockFirebase.prototype.name = function () {
  console.warn('ref.name() is deprecated. Use ref.key');
  return this.key;
};

MockFirebase.prototype._getRoot = function () {
  var next = this;
  while (next.parent) {
    next = next.parent;
  }
  return next;
};

MockFirebase.prototype.push = function (data, callback) {
  var child = this.child(this._newAutoId());
  var err = this._nextErr('push');
  if (err) child.failNext('set', err);
  if (arguments.length && data !== null) {
    // currently, callback only invoked if child exists
    validate.data(data);
    return utils.createThenableReference(child, child.set(data, callback));
  } else {
    return utils.createThenableReference(child, Promise.resolve(child));
  }
};

MockFirebase.prototype.once = function (event, callback, cancel, context) {
  validate.event(event);
  if (arguments.length === 3 && !_.isFunction(cancel)) {
    context = cancel;
    cancel = _.noop;
  }
  cancel = cancel || _.noop;
  var self = this;
  return new Promise(function (resolve, reject) {
    var err = self._nextErr('once');
    if (err) {
      self._defer('once', _.toArray(arguments), function () {
        if (cancel) {
          cancel.call(context, err);
        }
        reject(err);
      });
    }
    else {
      var fn = _.bind(function (snapshot) {
        self.off(event, fn, context);
        if (callback) {
          callback.call(context, snapshot);
        }
        resolve(snapshot);
      }, self);
      self._on('once', event, fn, cancel, context);
    }
  });
};

MockFirebase.prototype.remove = function (callback) {
  var err = this._nextErr('remove');
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('remove', _.toArray(arguments), function () {
      if (callback) callback(err);
      if (err === null) {
        self._dataChanged(null);
        resolve(null);
      } else {
        reject(err);
      }
    });
  });
};

MockFirebase.prototype.on = function (event, callback, cancel, context) {
  validate.event(event);
  if (arguments.length === 3 && typeof cancel !== 'function') {
    context = cancel;
    cancel = _.noop;
  }
  cancel = cancel || _.noop;

  var err = this._nextErr('on');
  if (err) {
    this._defer('on', _.toArray(arguments), function () {
      cancel.call(context, err);
    });
  }
  else {
    this._on('on', event, callback, cancel, context);
  }
  return callback;
};

MockFirebase.prototype.off = function (event, callback, context) {
  if (!event) {
    for (var key in this._events) {
      /* istanbul ignore else */
      if (this._events.hasOwnProperty(key)) {
        this.off(key);
      }
    }
  }
  else {
    validate.event(event);
    if (callback) {
      var events = this._events[event];
      var newEvents = this._events[event] = [];
      _.forEach(events, function (parts) {
        if (parts[0] !== callback || parts[1] !== context) {
          newEvents.push(parts);
        }
      });
    }
    else {
      this._events[event] = [];
    }
  }
};

MockFirebase.prototype.transaction = function (valueFn, finishedFn, applyLocally) {
  var err = this._nextErr('transaction');
  var res = valueFn(this.getData());
  var newData = _.isUndefined(res) || err ? this.getData() : res;
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('transaction', _.toArray(arguments), function () {
      newData = utils.removeEmptyRtdbProperties(newData);
      self._dataChanged(newData);
      if (typeof finishedFn === 'function') {
        finishedFn(err, err === null && !_.isUndefined(res), new Snapshot(self, newData, self.priority));
      }
      if (err === null) {
        resolve({committed: err === null && !_.isUndefined(res), snapshot: new Snapshot(self, newData, self.priority)});
      } else {
        reject(err);
      }
    });
  });
};

/**
 * Just a stub at this point.
 * @param {int} limit
 */
MockFirebase.prototype.limit = function (limit) {
  return new Query(this).limitToLast(limit);
};

/**
 * Just a stub so it can be spied on during testing
 */
MockFirebase.prototype.limitToFirst = function (limit) {
  return new Query(this).limitToFirst(limit);
};

/**
 * Just a stub so it can be spied on during testing
 */
MockFirebase.prototype.limitToLast = function (limit) {
  return new Query(this).limitToLast(limit);
};

/**
 * Just a stub so it can be spied on during testing
 */
MockFirebase.prototype.orderByChild = function (child) {
  console.warn("orderByChild() is not supported by firebase-mock.  You will need to use spies to test this functionality.  Please refer to the firebase-mock README for more info.");
  return new Query(this);
};

/**
 * Just a stub so it can be spied on during testing
 */
MockFirebase.prototype.orderByKey = function (key) {
  console.warn("orderByKey() is not supported by firebase-mock.  You will need to use spies to test this functionality.  Please refer to the firebase-mock README for more info.");
  return new Query(this);
};

/**
 * Just a stub so it can be spied on during testing
 */
MockFirebase.prototype.orderByPriority = function (property) {
  console.warn("orderByPriority() is not supported by firebase-mock.  You will need to use spies to test this functionality.  Please refer to the firebase-mock README for more info.");
  return new Query(this);
};

/**
 * Just a stub so it can be spied on during testing
 */
MockFirebase.prototype.orderByValue = function (value) {
  console.warn("orderByValue() is not supported by firebase-mock.  You will need to use spies to test this functionality.  Please refer to the firebase-mock README for more info.");
  return new Query(this);
};

MockFirebase.prototype.startAt = function (priority, key) {
  return new Query(this).startAt(priority, key);
};

MockFirebase.prototype.endAt = function (priority, key) {
  return new Query(this).endAt(priority, key);
};

MockFirebase.prototype.equalTo = function (priority, key) {
  return new Query(this).equalTo(priority, key);
};

MockFirebase.prototype._childChanged = function (ref) {
  var events = [];
  var childKey = ref.key;
  var data = ref.getData();
  if (data === null) {
    this._removeChild(childKey, events);
  }
  else {
    this._updateOrAdd(childKey, data, events);
  }
  this._triggerAll(events);
};

MockFirebase.prototype._dataChanged = function (unparsedData) {
  var self = this;
  var pri = utils.getMeta(unparsedData, 'priority', this.priority);
  var data = utils.cleanData(unparsedData);

  if (utils.isServerTimestamp(data)) {
    data = Timestamp.fromMillis(utils.getServerTime());
  }

  if (pri !== this.priority) {
    this._priChanged(pri);
  }
  if (!_.isEqual(data, this.data)) {
    // _.keys() in Lodash 3 automatically coerces non-object to object
    var oldKeys = _.isPlainObject(this.data) ? _.keys(this.data).sort() : [];
    var newKeys = _.isPlainObject(data) ? _.keys(data).sort() : [];
    var keysToRemove = _.difference(oldKeys, newKeys);
    var keysToChange = _.difference(newKeys, keysToRemove);
    var events = [];

    keysToRemove.forEach(function (key) {
      self._removeChild(key, events);
    });

    if (!_.isPlainObject(data)) {
      events.push(false);
      this.data = data;
    }
    else {
      keysToChange.forEach(function (key) {
        var childData = unparsedData[key];
        if (utils.isServerTimestamp(childData)) {
          childData = Timestamp.fromMillis(utils.getServerTime());
        }
        self._updateOrAdd(key, childData, events);
      });
    }

    // update order of my child keys
    if (_.isPlainObject(this.data))
      this._resort();

    // trigger parent notifications after all children have
    // been processed
    this._triggerAll(events);
  }
};

MockFirebase.prototype._priChanged = function (newPriority) {
  if (utils.isServerTimestamp(newPriority)) {
    newPriority = Timestamp.fromMillis(utils.getServerTime());
  }
  this.priority = newPriority;
  if (this.parent) {
    this.parent._resort(this.key);
  }
};

MockFirebase.prototype._getPri = function (key) {
  return _.has(this.children, key) ? this.children[key].priority : null;
};

MockFirebase.prototype._resort = function (childKeyMoved) {
  var self = this;
  this.sortedDataKeys.sort(_.bind(this.childComparator, this));
  // resort the data object to match our keys so value events return ordered content
  var oldData = _.assign({}, this.data);
  _.forEach(oldData, function (v, k) {
    delete self.data[k];
  });
  _.forEach(this.sortedDataKeys, function (k) {
    self.data[k] = oldData[k];
  });
  if (!_.isUndefined(childKeyMoved) && _.has(this.data, childKeyMoved)) {
    this._trigger('child_moved', this.data[childKeyMoved], this._getPri(childKeyMoved), childKeyMoved);
  }
};

MockFirebase.prototype._addKey = function (newKey) {
  if (_.indexOf(this.sortedDataKeys, newKey) === -1) {
    this.sortedDataKeys.push(newKey);
    this._resort();
  }
};

MockFirebase.prototype._dropKey = function (key) {
  var i = _.indexOf(this.sortedDataKeys, key);
  if (i > -1) {
    this.sortedDataKeys.splice(i, 1);
  }
};

MockFirebase.prototype._defer = function (sourceMethod, sourceArgs, callback) {
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

MockFirebase.prototype._trigger = function (event, data, pri, key) {
  var self = this;
  var ref = event === 'value' ? this : this.child(key);
  var snap = new Snapshot(ref, data, pri);
  _.forEach(this._events[event], function (parts) {
    var fn = parts[0], context = parts[1];
    if (_.includes(['child_added', 'child_moved'], event)) {
      fn.call(context, snap, self._getPrevChild(key));
    }
    else {
      fn.call(context, snap);
    }
  });
};

MockFirebase.prototype._triggerAll = function (events) {
  var self = this;
  if (!events.length) return;
  events.forEach(function (event) {
    if (event !== false) self._trigger.apply(self, event);
  });
  this._trigger('value', this.data, this.priority);
  if (this.parent) {
    this.parent._childChanged(this);
  }
};

MockFirebase.prototype._updateOrAdd = function (key, data, events) {
  var exists = _.isPlainObject(this.data) && this.data.hasOwnProperty(key);
  if (!exists) {
    return this._addChild(key, data, events);
  }
  else {
    return this._updateChild(key, data, events);
  }
};

MockFirebase.prototype._addChild = function (key, data, events) {
  if (!_.isPlainObject(this.data)) {
    this.data = {};
  }
  this._addKey(key);
  this.data[key] = utils.cleanData(data);
  var child = this.child(key);
  child._dataChanged(data);
  if (events) events.push(['child_added', child.getData(), child.priority, key]);
};

MockFirebase.prototype._removeChild = function (key, events) {
  if (this._hasChild(key)) {
    this._dropKey(key);
    var data = this.data[key];
    delete this.data[key];
    if (_.isEmpty(this.data)) {
      this.data = null;
    }
    if (_.has(this.children, key)) {
      this.children[key]._dataChanged(null);
    }
    if (events) events.push(['child_removed', data, null, key]);
  }
};

MockFirebase.prototype._updateChild = function (key, data, events) {
  var cdata = utils.cleanData(data);
  if (_.isPlainObject(this.data) && _.has(this.data, key) && !_.isEqual(this.data[key], cdata)) {
    this.data[key] = cdata;
    var c = this.child(key);
    c._dataChanged(data);
    if (events) events.push(['child_changed', c.getData(), c.priority, key]);
  }
};

MockFirebase.prototype._newAutoId = function () {
  return (this._lastAutoId = MockFirebase.autoId());
};

MockFirebase.prototype._nextErr = function (type) {
  var err = this.errs[type];
  delete this.errs[type];
  return err || null;
};

MockFirebase.prototype._hasChild = function (key) {
  return _.isPlainObject(this.data) && _.has(this.data, key);
};

MockFirebase.prototype._childData = function (key) {
  return this._hasChild(key) ? this.data[key] : null;
};

MockFirebase.prototype._getPrevChild = function (key) {
//      this._resort();
  var keys = this.sortedDataKeys;
  var i = _.indexOf(keys, key);
  if (i === -1) {
    keys = keys.slice();
    keys.push(key);
    keys.sort(_.bind(this.childComparator, this));
    i = _.indexOf(keys, key);
  }
  return i === 0 ? null : keys[i - 1];
};

MockFirebase.prototype._on = function (deferName, event, callback, cancel, context) {
  var self = this;
  var handlers = [callback, context, cancel];
  this._events[event].push(handlers);
  // value and child_added both trigger initial events when called so
  // defer those here
  if ('value' === event || 'child_added' === event) {
    self._defer(deferName, _.toArray(arguments).slice(1), function () {
      // make sure off() wasn't called before we triggered this
      if (self._events[event].indexOf(handlers) > -1) {
        switch (event) {
          case 'value':
            callback.call(context, new Snapshot(self, self.getData(), self.priority));
            break;
          case 'child_added':
            var previousChild = null;
            self.sortedDataKeys
              .forEach(function (key) {
                var child = self.child(key);
                callback.call(context, new Snapshot(child, child.getData(), child.priority), previousChild);
                previousChild = key;
              });
            break;
        }
      }
    });
  }
};

MockFirebase.prototype.childComparator = function (a, b) {
  var aPri = this._getPri(a);
  var bPri = this._getPri(b);
  var x = utils.priorityComparator(aPri, bPri);
  if (x === 0) {
    if (a !== b) {
      x = a < b ? -1 : 1;
    }
  }
  return x;
};

function extractName(path) {
  return ((path || '').match(/\/([^.$\[\]#\/]+)$/) || [null, null])[1];
}

function render(datum) {
  if (datum && _.isPlainObject(datum)) {
    var keys = _.keys(datum);

    if (_.every(keys, RegExp.prototype.test.bind(/^\d+$/))) {
      var max = keys.reduce(function (max, key) {
        var n = Number(key);
        return n > max ? n : max;
      }, 0);

      if (keys.length * 2 > max) {
        var array = Array(max);

        _.forIn(datum, function (value, key) {
          array[Number(key)] = value;
        });

        return array;
      }
    } else {
      return _.cloneDeep(datum);
    }
  } else {
    return _.clone(datum);
  }
}

module.exports = MockFirebase;
