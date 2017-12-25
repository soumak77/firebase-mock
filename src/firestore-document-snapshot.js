'use strict';

var _ = require('lodash');

function MockFirestoreDocumentSnapshot (data) {
  data = _.cloneDeep(data) || null;
  if (_.isObject(data) && _.isEmpty(data)) {
    data = null;
  }
  this.data = function() {
    return data;
  };
  this.exists = data !== null;
}

MockFirestoreDocumentSnapshot.prototype.get = function (path) {
  var parts = path.split('/');
  var part = parts.shift();
  var value = null;
  while (part) {
    value = this.data()[part];
    part = parts.shift();
  }
  return value;
};

module.exports = MockFirestoreDocumentSnapshot;
