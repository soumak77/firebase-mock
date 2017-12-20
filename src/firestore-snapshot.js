'use strict';

var _ = require('lodash');

function MockDataSnapshot (ref, data, priority) {
  this.ref = ref;
  this.id = ref.key;
  data = _.cloneDeep(data);
  if (_.isObject(data) && _.isEmpty(data)) {
    data = null;
  }
  this.data = function () {
    return data;
  };
  this.exists = data !== null;
}

MockDataSnapshot.prototype.child = function (key) {
  var ref = this.ref.child(key);
  var data = this.hasChild(key) ? this.data()[key] : null;
  var priority = this.ref.child(key).priority;
  return new MockDataSnapshot(ref, data, priority);
};

MockDataSnapshot.prototype.forEach = function (callback, context) {
  _.each(this.data(), function (value, key) {
    callback.call(context, this.child(key));
  }, this);
};

MockDataSnapshot.prototype.hasChild = function (path) {
  return !!(this.data() && this.data()[path]);
};

MockDataSnapshot.prototype.hasChildren = function () {
  return !!this.numChildren();
};

MockDataSnapshot.prototype.numChildren = function () {
  return _.size(this.data());
};

function isValue (value) {
  return !_.isObject(value);
}

module.exports = MockDataSnapshot;
