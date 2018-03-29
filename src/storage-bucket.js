/*
  Mock for @google-cloud/storage Bucket
  https://cloud.google.com/nodejs/docs/reference/storage/1.6.x/Bucket
*/

'use strict';
var Promise = require('rsvp').Promise;
var MockStorageFile = require('./storage-file');

function MockStorageBucket(storage, name) {
  this.storage = storage;
  this.name = name;
  this.files = {};
}

MockStorageBucket.prototype.file = function (name) {
  if (!this.files[name]) {
    this.files[name] = new MockStorageFile(this, name);
  }
  return this.files[name];
};

MockStorageBucket.prototype.deleteFile = function (name) {
  if (this.files[name]) {
    delete this.files[name];
  }
  return Promise.resolve();
};

module.exports = MockStorageBucket;
