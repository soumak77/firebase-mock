'use strict';
var Promise = require('rsvp').Promise;
var fs = require('fs');

function MockStorageFile(bucket, name) {
  this.bucket = bucket;
  this.name = name;
  this._contents = null;
  this._metadata = null;
}

MockStorageFile.prototype.get = function() {
  return Promise.resolve([this, null]);
};

MockStorageFile.prototype.save = function(data) {
  this._contents = data;
  return Promise.resolve();
};

MockStorageFile.prototype.exists = function() {
  return Promise.resolve([this._contents !== null]);
};

MockStorageFile.prototype.getSignedUrl = function() {
  return Promise.resolve(this.name);
};

MockStorageFile.prototype.download = function(args) {
  var self = this;
  return new Promise(function(resolve, reject) {
    fs.writeFile(args.destination, self._contents, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

MockStorageFile.prototype.delete = function() {
  this._contents = null;
  return this.bucket.deleteFile(this._path);
};

module.exports = MockStorageFile;
