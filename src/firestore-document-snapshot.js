'use strict';

var _ = require('./lodash');
var FieldPath = require('./firestore-field-path');

function MockFirestoreDocumentSnapshot (id, ref, data) {
  this.id = id;
  this.ref = ref;
  this._snapshotdata = _.cloneDeep(data) || null;
  this.data = function() {
    return _.cloneDeep(this._snapshotdata);
  };
  this.exists = this._snapshotdata !== null;
}

MockFirestoreDocumentSnapshot.prototype.get = function (field) {
  if (!field || !this.exists) return undefined;

  var parts;
  if (FieldPath.documentId().isEqual(field)) {
    return this.id;
  } else if (field instanceof FieldPath) {
    parts = _.clone(field._path);
  } else {
    parts = field.split('.');
  }
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
