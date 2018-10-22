'use strict';

var _ = require('./lodash');

function MockDataSnapshot (ref, data, priority) {
  this.ref = ref;
  this.key = ref.key;
  this._snapshotdata = _.cloneDeep(data);
  if (_.isObject(this._snapshotdata) && _.isEmpty(this._snapshotdata)) {
    this._snapshotdata = null;
  }
  this.getPriority = function () {
    return priority;
  };
}

MockDataSnapshot.prototype.child = function (path) {
  if (typeof path === 'number') path = String(path);
  // Strip leading or trailing /
  path = path.replace(/^\/|\/$/g, '');
  var ref = this.ref.child(path);
  var data = null;
  
  var key;
  var firstPathIdx = path.indexOf('/');
  if (firstPathIdx === -1) {
    // Single path
    key = path;
    path = null;
  } else {
    // Multiple paths
    key = path.slice(0, firstPathIdx);
    path = path.slice(firstPathIdx + 1);
  }
  if (_.isObject(this._snapshotdata) && !_.isUndefined(this._snapshotdata[key])) {
    data = this._snapshotdata[key];
  }
  var snapshot = new MockDataSnapshot(ref, data, ref.priority);
  if (path === null) {
    return snapshot;
  } else {
    // Look for child
    return snapshot.child(path);
  }
};

MockDataSnapshot.prototype.val = function () {
  return _.cloneDeep(this._snapshotdata);
};

MockDataSnapshot.prototype.exists = function () {
  return this._snapshotdata !== null;
};

MockDataSnapshot.prototype.forEach = function (callback, context) {
  var self = this;
  _.forEach(this._snapshotdata, function (value, key) {
    callback.call(context, self.child(key));
  });
};

MockDataSnapshot.prototype.hasChild = function (path) {
  return this.child(path).exists();
};

MockDataSnapshot.prototype.hasChildren = function () {
  return !!this.numChildren();
};

MockDataSnapshot.prototype.name = function () {
  console.warn('DataSnapshot.name() is deprecated. Use DataSnapshot.key');
  return this.key;
};

MockDataSnapshot.prototype.numChildren = function () {
  return _.size(this._snapshotdata);
};


MockDataSnapshot.prototype.exportVal = function () {
  var self = this;
  var exportData = {};
  var priority = this.getPriority();
  var hasPriority = _.isString(priority) || _.isNumber(priority);
  if (hasPriority) {
    exportData['.priority'] = priority;
  }
  if (isValue(this._snapshotdata)) {
    if (hasPriority) {
      exportData['.value'] = this.val();
    }
    else {
      exportData = this.val();
    }
  }
  else {
    _.reduce(this._snapshotdata, function (acc, value, key) {
      acc[key] = self.child(key).exportVal();
      return acc;
    }, exportData);
  }
  return exportData;
};

function isValue (value) {
  return !_.isObject(value);
}

module.exports = MockDataSnapshot;
