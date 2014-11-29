'use strict';

var _        = require('lodash');
var Snapshot = require('./snapshot');
var utils    = require('./utils');

function MockQuery (ref) {
  this.ref = function () {
    return ref;
  };
  this._subs = [];
  // startPri, endPri, startKey, endKey, and limit
  this._q = {};
}

MockQuery.prototype.flush = function () {
  var ref = this.ref();
  ref.flush.apply(ref, arguments);
  return this;
};

MockQuery.prototype.autoFlush = function () {
  var ref = this.ref();
  ref.autoFlush.apply(ref, arguments);
  return this;
};

MockQuery.prototype.slice = function () {
  return new Slice(this);
};

MockQuery.prototype.getData = function () {
  return this.slice().data;
};

MockQuery.prototype.fakeEvent = function (event, snap) {
  _.each(this._subs, function (parts) {
    if( parts[0] === 'event' ) {
      parts[1].call(parts[2], snap);
    }
  });
};

MockQuery.prototype.on = function (event, callback, cancelCallback, context) {
  var self = this, isFirst = true, lastSlice = this.slice(), map;
  var fn = function (snap, prevChild) {
    var slice = new Slice(self, event==='value'? snap : utils.makeRefSnap(snap.ref().parent()));
    switch(event) {
      case 'value':
        if( isFirst || !lastSlice.equals(slice) ) {
          callback.call(context, slice.snap());
        }
        break;
      case 'child_moved':
        var x = slice.pos(snap.key());
        var y = slice.insertPos(snap.key());
        if( x > -1 && y > -1 ) {
          callback.call(context, snap, prevChild);
        }
        else if( x > -1 || y > -1 ) {
          map = lastSlice.changeMap(slice);
        }
        break;
      case 'child_added':
        if( slice.has(snap.key()) && lastSlice.has(snap.key()) ) {
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
      default:
        throw new Error('Invalid event: '+event);
    }

    if( map ) {
      var newSnap = slice.snap();
      var oldSnap = lastSlice.snap();
      _.each(map.added, function (addKey) {
        self.fakeEvent('child_added', newSnap.child(addKey));
      });
      _.each(map.removed, function (remKey) {
        self.fakeEvent('child_removed', oldSnap.child(remKey));
      });
    }

    isFirst = false;
    lastSlice = slice;
  };
  var cancelFn = function (err) {
    cancelCallback.call(context, err);
  };
  self._subs.push([event, callback, context, fn]);
  this.ref().on(event, fn, cancelFn);
};

MockQuery.prototype.off = function (event, callback, context) {
  var ref = this.ref();
  _.each(this._subs, function (parts) {
    if( parts[0] === event && parts[1] === callback && parts[2] === context ) {
      ref.off(event, parts[3]);
    }
  });
};

MockQuery.prototype.once = function (event, callback, context) {
  var self = this;
  // once is tricky because we want the first match within our range
  // so we use the on() method above which already does the needed legwork
  function fn() {
    self.off(event, fn);
    // the snap is already sliced in on() so we can just pass it on here
    callback.apply(context, arguments);
  }
  self.on(event, fn);
};

MockQuery.prototype.limit = function (intVal) {
  if( typeof intVal !== 'number' ) {
    throw new Error('Query.limit: First argument must be a positive integer.');
  }
  var q = new MockQuery(this.ref());
  _.extend(q._q, this._q, {limit: intVal});
  return q;
};

MockQuery.prototype.startAt = function (priority, key) {
  assertQuery('Query.startAt', priority, key);
  var q = new MockQuery(this.ref());
  _.extend(q._q, this._q, {startKey: key, startPri: priority});
  return q;
};

MockQuery.prototype.endAt = function (priority, key) {
  assertQuery('Query.endAt', priority, key);
  var q = new MockQuery(this.ref());
  _.extend(q._q, this._q, {endKey: key, endPri: priority});
  return q;
};

function Slice(queue, snap) {
  var data = snap? snap.val() : queue.ref().getData();
  this.ref = snap? snap.ref() : queue.ref();
  this.priority = snap? snap.getPriority() : this.ref.priority;
  this.pris = {};
  this.data = {};
  this.map = {};
  this.outerMap = {};
  this.keys = [];
  this.props = this._makeProps(queue._q, this.ref, this.ref.getKeys().length);
  this._build(this.ref, data);
}

Slice.prototype = {
  prev: function(key) {
    var pos = this.pos(key);
    if( pos === 0 ) { return null; }
    else {
      if( pos < 0 ) { pos = this.keys.length; }
      return this.keys[pos-1];
    }
  },

  equals: function(slice) {
    return _.isEqual(this.keys, slice.keys) && _.isEqual(this.data, slice.data);
  },

  pos: function(key) {
    return this.has(key)? this.map[key] : -1;
  },

  insertPos: function(prevChild) {
    var outerPos = this.outerMap[prevChild];
    if( outerPos >= this.min && outerPos < this.max ) {
      return outerPos+1;
    }
    return -1;
  },

  has: function(key) {
    return this.map.hasOwnProperty(key);
  },

  snap: function(key) {
    var ref = this.ref;
    var data = this.data;
    var pri = this.priority;
    if( key ) {
      data = this.get(key);
      ref = ref.child(key);
      pri = this.pri(key);
    }
    return new Snapshot(ref, data, pri);
  },

  get: function(key) {
    return this.has(key)? this.data[key] : null;
  },

  pri: function(key) {
    return this.has(key)? this.pris[key] : null;
  },

  changeMap: function(slice) {
    var self = this;
    var changes = { in: [], out: [] };
    _.each(self.data, function(v,k) {
      if( !slice.has(k) ) {
        changes.out.push(k);
      }
    });
    _.each(slice.data, function(v,k) {
      if( !self.has(k) ) {
        changes.in.push(k);
      }
    });
    return changes;
  },

  _inRange: function(props, key, pri, pos) {
    if( pos === -1 ) { return false; }
    if( !_.isUndefined(props.startPri) && utils.priorityComparator(pri, props.startPri) < 0 ) {
      return false;
    }
    if( !_.isUndefined(props.startKey) && utils.priorityComparator(key, props.startKey) < 0 ) {
      return false;
    }
    if( !_.isUndefined(props.endPri) && utils.priorityComparator(pri, props.endPri) > 0 ) {
      return false;
    }
    if( !_.isUndefined(props.endKey) && utils.priorityComparator(key, props.endKey) > 0 ) {
      return false;
    }
    if( props.max > -1 && pos > props.max ) {
      return false;
    }
    return pos >= props.min;
  },

  _findPos: function(pri, key, ref, isStartBoundary) {
    var keys = ref.getKeys(), firstMatch = -1, lastMatch = -1;
    var len = keys.length, i, x, k;
    if(_.isUndefined(pri) && _.isUndefined(key)) {
      return -1;
    }
    for(i = 0; i < len; i++) {
      k = keys[i];
      x = utils.priAndKeyComparator(pri, key, ref.child(k).priority, k);
      if( x === 0 ) {
        // if the key is undefined, we may have several matching comparisons
        // so we will record both the first and last successful match
        if (firstMatch === -1) {
          firstMatch = i;
        }
        lastMatch = i;
      }
      else if( x < 0 ) {
        // we found the breakpoint where our keys exceed the match params
        if( i === 0 ) {
          // if this is 0 then our match point is before the data starts, we
          // will use len here because -1 already has a special meaning (no limit)
          // and len ensures we won't get any data (no matches)
          i = len;
        }
        break;
      }
    }

    if( firstMatch !== -1 ) {
      // we found a match, life is simple
      return isStartBoundary? firstMatch : lastMatch;
    }
    else if( i < len ) {
      // if we're looking for the start boundary then it's the first record after
      // the breakpoint. If we're looking for the end boundary, it's the last record before it
      return isStartBoundary? i : i -1;
    }
    else {
      // we didn't find one, so use len (i.e. after the data, no results)
      return len;
    }
  },

  _makeProps: function(queueProps, ref, numRecords) {
    var out = {};
    _.each(queueProps, function(v,k) {
      if(!_.isUndefined(v)) {
        out[k] = v;
      }
    });
    out.min = this._findPos(out.startPri, out.startKey, ref, true);
    out.max = this._findPos(out.endPri, out.endKey, ref);
    if( !_.isUndefined(queueProps.limit) ) {
      if( out.min > -1 ) {
        out.max = out.min + queueProps.limit;
      }
      else if( out.max > -1 ) {
        out.min = out.max - queueProps.limit;
      }
      else if( queueProps.limit < numRecords ) {
        out.max = numRecords-1;
        out.min = Math.max(0, numRecords - queueProps.limit);
      }
    }
    return out;
  },

  _build: function(ref, rawData) {
    var i = 0, map = this.map, keys = this.keys, outer = this.outerMap;
    var props = this.props, slicedData = this.data;
    _.each(rawData, function(v,k) {
      outer[k] = i < props.min? props.min - i : i - Math.max(props.min,0);
      if( this._inRange(props, k, ref.child(k).priority, i++) ) {
        map[k] = keys.length;
        keys.push(k);
        slicedData[k] = v;
      }
    }, this);
  }
};

function assertQuery(method, pri, key) {
  if (pri !== null && typeof(pri) !== 'string' && typeof(pri) !== 'number') {
    throw new Error(method + ' failed: first argument must be a valid firebase priority (a string, number, or null).');
  }
  if (!_.isUndefined(key)) {
    utils.assertKey(method, key, 'second');
  }
}

module.exports = MockQuery;
