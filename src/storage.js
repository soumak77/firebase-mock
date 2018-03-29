'use strict';
var MockStorageBucket = require('./storage-bucket');

function MockStorage() {
  this.buckets = {};
}

MockStorage.prototype.bucket = function(name) {
  if (!this.buckets[name]) {
    this.buckets[name] = new MockStorageBucket(this, name);
  }
  return this.buckets[name];
};

module.exports = MockStorage;
