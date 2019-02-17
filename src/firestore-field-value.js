'use strict';

function MockFirestoreFieldValue(type, arg) {
  this.type = type;
  this.arg = arg;
}

MockFirestoreFieldValue.prototype.isEqual = function (other) {
  if (other instanceof MockFirestoreFieldValue && this.type === other.type) {
    return true;
  }
  return false;
};

MockFirestoreFieldValue.delete = function () {
  return new MockFirestoreFieldValue('delete');
};

MockFirestoreFieldValue.serverTimestamp = function () {
  return new MockFirestoreFieldValue('serverTimestamp');
};

MockFirestoreFieldValue.arrayRemove = function (arg) {
  return new MockFirestoreFieldValue('arrayRemove', arg);
};

MockFirestoreFieldValue.arrayUnion = function (arg) {
  return new MockFirestoreFieldValue('arrayUnion', arg);
};

module.exports = MockFirestoreFieldValue;
