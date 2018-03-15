'use strict';

var _ = require('./lodash');
var Slice    = require('./slice');
var utils    = require('./utils');
var validate = require('./validators');
var rsvp     = require('rsvp');

function MockQuery (ref) {
  this.ref = ref;
  this._events = [];
  // startPri, endPri, startKey, endKey, and limit
  this._q = {};
}

MockQuery.prototype.flush = function () {
  var ref = this.ref;
  ref.flush.apply(ref, arguments);
  return this;
};

MockQuery.prototype.autoFlush = function () {
  var ref = this.ref;
  ref.autoFlush.apply(ref, arguments);
  return this;
};

MockQuery.prototype.slice = function () {
  return new Slice(this);
};

MockQuery.prototype.getData = function () {
  return this.slice().data;
};

MockQuery.prototype.fakeEvent = function (event, snapshot) {
  validate.event(event);
  _.forEach(_.filter(this._events, function (parts) {
    return parts[0] === event;
  }), function (parts) {
    parts[1].call(parts[2], snapshot);
  });
};

MockQuery.prototype.on = function (event, callback, cancelCallback, context) {
  validate.event(event);
  if (arguments.length === 3 && typeof cancelCallback !== 'function') {
    context = cancelCallback;
    cancelCallback = _.noop;
  }
  cancelCallback = cancelCallback || _.noop;
  var self = this;
  var isFirst = true;
  var lastSlice = this.slice();
  var map;
  function handleRefEvent (snap, prevChild) {
    var slice = new Slice(self, event === 'value' ? snap : utils.makeRefSnap(snap.ref.parent));
    switch (event) {
      case 'value':
        if (isFirst || !lastSlice.equals(slice)) {
          callback.call(context, slice.snap());
        }
        break;
      case 'child_moved':
        var x = slice.pos(snap.key);
        var y = slice.insertPos(snap.key);
        if (x > -1 && y > -1) {
          callback.call(context, snap, prevChild);
        }
        else if (x > -1 || y > -1) {
          map = lastSlice.changeMap(slice);
        }
        break;
      case 'child_added':
        if (slice.has(snap.key) && lastSlice.has(snap.key)) {
          // is a child_added for existing event so allow it
          callback.call(context, snap, prevChild);
        }
        map = lastSlice.changeMap(slice);
        break;
      case 'child_removed':
        map = lastSlice.changeMap(slice);
        break;
      case 'child_changed':
        callback.call(context, snap);
        break;
    }

    if (map) {
      var newSnap = slice.snap();
      var oldSnap = lastSlice.snap();
      _.forEach(map.added, function (addKey) {
        self.fakeEvent('child_added', newSnap.child(addKey));
      });
      _.forEach(map.removed, function (remKey) {
        self.fakeEvent('child_removed', oldSnap.child(remKey));
      });
    }

    isFirst = false;
    lastSlice = slice;
  }
  this._events.push([event, callback, context, handleRefEvent]);
  this.ref.on(event, handleRefEvent, _.bind(cancelCallback, context));
};

MockQuery.prototype.off = function (event, callback, context) {
  var ref = this.ref;
  _.forEach(this._events, function (parts) {
    if( parts[0] === event && parts[1] === callback && parts[2] === context ) {
      ref.off(event, parts[3]);
    }
  });
};

MockQuery.prototype.once = function (event, callback, context) {
  validate.event(event);
  var self = this;
  return new rsvp.Promise(function(resolve, reject) {
    // once is tricky because we want the first match within our range
    // so we use the on() method above which already does the needed legwork
    function fn() {
      self.off(event, fn);
      // the snap is already sliced in on() so we can just pass it on here
      if (callback) {
        callback.apply(context, arguments[0]);
      }
      resolve(arguments[0]);
    }
    self.on(event, fn, reject);
  });
};

MockQuery.prototype.limitToFirst = function (intVal) {
  if( typeof intVal !== 'number' ) {
    throw new Error('Query.limitToFirst: First argument must be a positive integer.');
  }
  var q = new MockQuery(this.ref);
  _.extend(q._q, this._q, {
    limit: intVal,
    limitorder: 'first'
  });
  return q;
};

MockQuery.prototype.limitToLast = function (intVal) {
  if( typeof intVal !== 'number' ) {
    throw new Error('Query.limitToLast: First argument must be a positive integer.');
  }
  var q = new MockQuery(this.ref);
  _.extend(q._q, this._q, {
    limit: intVal,
    limitorder: 'last'
  });
  return q;
};

MockQuery.prototype.equalTo = function (priority, key) {
  return this.startAt(priority, key).endAt(priority, key);
};

MockQuery.prototype.startAt = function (priority, key) {
  assertQuery('Query.startAt', priority, key);
  var q = new MockQuery(this.ref);
  _.extend(q._q, this._q, {startKey: key, startPri: priority});
  return q;
};

MockQuery.prototype.endAt = function (priority, key) {
  assertQuery('Query.endAt', priority, key);
  var q = new MockQuery(this.ref);
  _.extend(q._q, this._q, {endKey: key, endPri: priority});
  return q;
};

function assertQuery (method, pri, key) {
  if (pri !== null && typeof(pri) !== 'string' && typeof(pri) !== 'number') {
    throw new Error(method + ' failed: first argument must be a valid firebase priority (a string, number, or null).');
  }
  if (!_.isUndefined(key)) {
    utils.assertKey(method, key, 'second');
  }
}

module.exports = MockQuery;
