/*
  Mock for firebase.storage.Reference
  https://firebase.google.com/docs/reference/js/firebase.storage.Reference
*/

'use strict';
var Promise = require('rsvp').Promise;

function MockStorageReference(storage, parent, name) {
  this.bucket = parent ? parent.bucket : name;
  this.storage = storage;
  this.parent = parent;
  this.name = name;
  this.root = parent ? parent.root : this;
  this._children = {};
  this._contents = null;

  if (parent) {
    this.fullPath = parent.fullPath + '/' + name;
    parent._children[name] = this;
  } else {
    this.fullPath = name;
  }
}

MockStorageReference.prototype.child = function(path) {
  // replace multiple consecutive slashs with single slash
  path = path.replace(/\/+/g,'/');

  // replace leading slash
  path = path.replace(/^\//g,'');

  // replace trailing slash
  path = path.replace(/\/$/g,'');

  // get all paths
  var paths = path.split('/');

  // create child reference
  var childPath = paths.shift();
  if (!this._children[childPath]) {
    this._children[childPath] = new MockStorageReference(this.storage, this, childPath);
  }

  if (paths.length === 0) {
    return this._children[childPath];
  } else {
    return this._children[childPath].child(paths.join('/'));
  }
};

MockStorageReference.prototype.getDownloadURL = function() {
  return Promise.resolve(this.fullPath);
};

MockStorageReference.prototype.delete = function() {
  this._contents = null;
  return Promise.resolve();
};

MockStorageReference.prototype.put = function(data) {
  this._contents = data;
  return Promise.resolve();
};

MockStorageReference.prototype.putString = function(data) {
  this._contents = data;
  return Promise.resolve();
};

module.exports = MockStorageReference;
