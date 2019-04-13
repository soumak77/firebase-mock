'use strict';

var _ = require('./lodash');

function MockFirestoreFieldPath() {
  this._path = [].slice.call(arguments);
}

MockFirestoreFieldPath.prototype.isEqual = function (other) {
  if (other instanceof MockFirestoreFieldPath && _.isEqual(this._path, other._path)) {
    return true;
  }
  return false;
};

MockFirestoreFieldPath.prototype._toString = function () {
  return this._path.join('.');
};

MockFirestoreFieldPath.documentId = function () {
  return new MockFirestoreFieldPath('_DOCUMENT_ID');
};

module.exports = MockFirestoreFieldPath;
