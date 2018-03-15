'use strict';

var _        = require('./lodash');
var Snapshot = require('./snapshot');
var utils    = require('./utils');

function Slice (queue, snap) {
  var data = snap? snap.val() : queue.ref.getData();
  this.ref = snap? snap.ref : queue.ref;
  this.priority = snap? snap.getPriority() : this.ref.priority;
  this.pris = {};
  this.data = {};
  this.map = {};
  this.outerMap = {};
  this.keys = [];
  this.props = this._makeProps(queue._q, this.ref, this.ref.getKeys().length);
  this._build(this.ref, data);
}

Slice.prototype.prev = function (key) {
  var pos = this.pos(key);
  if( pos === 0 ) { return null; }
  else {
    if( pos < 0 ) { pos = this.keys.length; }
    return this.keys[pos-1];
  }
};

Slice.prototype.equals = function (slice) {
  return _.isEqual(this.keys, slice.keys) && _.isEqual(this.data, slice.data);
};

Slice.prototype.pos = function (key) {
  return this.has(key) ? this.map[key] : -1;
};

Slice.prototype.insertPos = function (prevChild) {
  var outerPos = this.outerMap[prevChild];
  if( outerPos >= this.min && outerPos < this.max ) {
    return outerPos+1;
  }
  return -1;
};

Slice.prototype.has = function (key) {
  return this.map.hasOwnProperty(key);
};

Slice.prototype.snap = function (key) {
  var ref = this.ref;
  var data = this.data;
  var pri = this.priority;
  if( key ) {
    data = this.get(key);
    ref = ref.child(key);
    pri = this.pri(key);
  }
  return new Snapshot(ref, data, pri);
};

Slice.prototype.get = function (key) {
  return this.has(key)? this.data[key] : null;
};

Slice.prototype.pri = function (key) {
  return this.has(key)? this.pris[key] : null;
};

Slice.prototype.changeMap = function (slice) {
  var self = this;
  var changes = { added: [], removed: [] };
  _.forEach(this.data, function(v,k) {
    if( !slice.has(k) ) {
      changes.removed.push(k);
    }
  });
  _.forEach(slice.data, function(v,k) {
    if( !self.has(k) ) {
      changes.added.push(k);
    }
  });
  return changes;
};

Slice.prototype._inRange = function (props, key, pri, pos) {
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
};

Slice.prototype._findPos = function (pri, key, ref, isStartBoundary) {
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
};

Slice.prototype._makeProps = function (queueProps, ref, numRecords) {
  var out = {};
  _.forEach(queueProps, function(v,k) {
    if(!_.isUndefined(v)) {
      out[k] = v;
    }
  });
  out.min = this._findPos(out.startPri, out.startKey, ref, true);
  out.max = this._findPos(out.endPri, out.endKey, ref);
  if( !_.isUndefined(queueProps.limit) ) {
    if (queueProps.limitorder !== 'first') {
      // limitToLast
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
    } else {
      // limitToFirst
      if( out.min > -1 ) {
        out.max = out.min + queueProps.limit;
      }
      else if( out.max > -1 ) {
        out.min = out.max - queueProps.limit;
      }
      else if( queueProps.limit < numRecords ) {
        out.min = 0;
        out.max = queueProps.limit - 1;
      }
    }
  }
  return out;
};

Slice.prototype._build = function(ref, rawData) {
  var self = this;
  var i = 0, map = this.map, keys = this.keys, outer = this.outerMap;
  var props = this.props, slicedData = this.data;
  _.forEach(rawData, function(v,k) {
    outer[k] = i < props.min? props.min - i : i - Math.max(props.min,0);
    if( self._inRange(props, k, ref.child(k).priority, i++) ) {
      map[k] = keys.length;
      keys.push(k);
      slicedData[k] = v;
    }
  });
};

module.exports = Slice;
