'use strict';

var _ = require('lodash');

function MockFirestoreDocumentSnapshot (id, ref, data) {
  this.id = id;
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

MockFirestoreDocumentSnapshot.prototype.get = function (path) {
  if (!path || !this.exists) return undefined;

  var parts = path.split('.');
  var part = parts.shift();
  var data = this.data();

  while (part) {
    if (!data.hasOwnProperty(part)) {
      return undefined;
    }

    data = data[part];
    part = parts.shift();
  }

  return data;
};

module.exports = MockFirestoreDocumentSnapshot;
