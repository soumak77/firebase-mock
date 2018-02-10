'use strict';

function MockFirestoreFieldValue(type) {
  this.type = type;
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

module.exports = MockFirestoreFieldValue;
