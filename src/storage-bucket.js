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
  this.storage.buckets[name] = this;
}

MockStorageBucket.prototype.file = function (name) {
  return new MockStorageFile(this, name);
};

MockStorageBucket.prototype.deleteFile = function (name) {
  if (this.files[name]) {
    delete this.files[name];
  }
  return Promise.resolve();
};

MockStorageBucket.prototype.getFiles = function (query) {
  var self = this;
  var files = [];
  Object.keys(this.files).forEach(function(name) {
    if (!query || !query.prefix) {
      files.push(self.files[name].clone());
    } else if (name.startsWith(query.prefix)) {
      files.push(self.files[name].clone());
    }
  });
  return Promise.resolve(files);
};

MockStorageBucket.prototype.deleteFiles = function (query) {
  var self = this;
  Object.keys(this.files).forEach(function(name) {
    if (!query || !query.prefix) {
      self.deleteFile(name);
    } else if (name.startsWith(query.prefix)) {
      self.deleteFile(name);
    }
  });
  return Promise.resolve();
};

MockStorageBucket.prototype.moveFile = function (oldPath, newPath) {
  this.files[newPath] = this.files[oldPath];
  this.files[newPath].name = newPath;
  return this.deleteFile(oldPath);
};

module.exports = MockStorageBucket;
