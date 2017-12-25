'use strict';

var _ = require('lodash');

function MockFirestoreDeltaDocumentSnapshot (id, data, previous, ref) {
  this.id = id;
  this.previous = previous;
  this.ref = ref;
  data = _.cloneDeep(data) || null;
  if (_.isObject(data) && _.isEmpty(data)) {
    data = null;
  }
  this.data = function() {
    return data;
  };
  this.exists = data !== null;
}

MockFirestoreDeltaDocumentSnapshot.prototype.get = function (path) {
  var parts = path.split('/');
  var part = parts.shift();
  var value = null;
  while (part) {
    value = this.data()[part];
    part = parts.shift();
  }
  return value;
};

MockFirestoreDeltaDocumentSnapshot.create = function(app, data, delta, path) {
  var id = path.split('/').pop();
  var ref = app.firestore().doc(path);
  var previous = data === null ? null : new MockFirestoreDeltaDocumentSnapshot(id, data, null, ref);
  return new MockFirestoreDeltaDocumentSnapshot(id, applyDelta(data, delta), previous, ref);
};

function applyDelta(data, delta) {
  if (data === null) {
    return delta;
  } else if (delta === null) {
    return null;
  } else if (typeof delta === 'string'|| typeof data === 'string') {
    return delta;
  } else {
    return Object.assign(data, delta);
  }
}

module.exports = MockFirestoreDeltaDocumentSnapshot;
