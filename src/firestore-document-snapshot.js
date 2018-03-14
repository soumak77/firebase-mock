'use strict';

var _ = require('lodash');

function MockFirestoreDocumentSnapshot (id, ref, data) {
  this.id = id;
  this.ref = ref;
  this._snapshotdata = _.cloneDeep(data) || null;
  this.data = function() {
    return _.cloneDeep(this._snapshotdata);
  };
  this.exists = this._snapshotdata !== null;
}

MockFirestoreDocumentSnapshot.prototype.get = function (path) {
  if (!path || !this.exists) return undefined;

  var parts = path.split('.');
  var part = parts.shift();
  var data = this.data();

  while (part) {
    if (!data || !data.hasOwnProperty(part)) {
      return undefined;
    }

    data = data[part];
    part = parts.shift();
  }

  return data;
};

module.exports = MockFirestoreDocumentSnapshot;
