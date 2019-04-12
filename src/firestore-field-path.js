'use strict';

var _ = require('./lodash');

function MockFirestoreFieldPath() {
  this._fieldNames = Array.prototype.slice.call(arguments);
}

MockFirestoreFieldPath.prototype.isEqual = function (other) {
  if (other instanceof MockFirestoreFieldPath && _.isEqual(this._fieldNames, other._fieldNames)) {
    return true;
  }
  return false;
};

MockFirestoreFieldPath.documentId = function () {
  return new MockFirestoreFieldPath('_DOCUMENT_ID');
};

module.exports = MockFirestoreFieldPath;
