/*
  Mock for firebase.storage.Storage and admin.storage.Storage
  https://firebase.google.com/docs/reference/js/firebase.storage.Storage
  https://firebase.google.com/docs/reference/admin/node/admin.storage.Storage
*/

'use strict';
var Promise = require('rsvp').Promise;
var MockStorageBucket = require('./storage-bucket');
var MockStorageReference = require('./storage-reference');

function MockStorage() {
  this.buckets = {};
  this.refs = {};
}

MockStorage.prototype.ref = function(path) {
  // replace multiple consecutive slashs with single slash
  path = path.replace(/\/+/g,'/');

  // replace leading slash
  path = path.replace(/^\//g,'');

  // replace trailing slash
  path = path.replace(/\/$/g,'');

  // get all paths
  var paths = path.split('/');

  // create root reference
  var rootPath = paths.shift();
  if (!this.refs[rootPath]) {
    this.refs[rootPath] = new MockStorageReference(this, null, rootPath);
  }

  if (paths.length === 0) {
    return this.refs[rootPath];
  } else {
    return this.refs[rootPath].child(paths.join('/'));
  }
};

MockStorage.prototype.bucket = function(name) {
  return new MockStorageBucket(this, name);
};

module.exports = MockStorage;
