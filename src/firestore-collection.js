'use strict';

var _ = require('lodash');
var assert = require('assert');
var Promise = require('rsvp').Promise;
var autoId = require('firebase-auto-ids');
var DocumentSnapshot = require('./firestore-document-snapshot');
var QuerySnapshot = require('./firestore-query-snapshot');
var Query = require('./firestore-query');
var Queue = require('./queue').Queue;
var utils = require('./utils');
var validate = require('./validators');

function MockFirestoreCollection(path, data, parent, name, DocumentReference) {
  _.extend(this, Query.prototype, new Query());
  this.ref = this;
  this.path = path || 'Mock://';
  this.DocumentReference = DocumentReference;
  this.errs = {};
  this.priority = null;
  this.id = parent ? name : extractName(path);
  this.flushDelay = parent ? parent.flushDelay : false;
  this.queue = parent ? parent.queue : new Queue();
  this._events = {
    value: [],
    child_added: [],
    child_removed: [],
    child_changed: [],
    child_moved: []
  };
  this.parent = parent || null;
  this.children = {};
  this.data = null;
  this._dataChanged(_.cloneDeep(data) || null);
}

MockFirestoreCollection.prototype.toString = function () {
  return this.path;
};

MockFirestoreCollection.defaultAutoId = function () {
  return autoId(new Date().getTime());
};

MockFirestoreCollection.autoId = MockFirestoreCollection.defaultAutoId;

MockFirestoreCollection.prototype.add = function (data) {
  var err = this._nextErr('add');
  data = utils.cleanFirestoreData(data);
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('add', _.toArray(arguments), function () {
      if (err === null) {
        var id = MockFirestoreCollection.autoId();
        self.data = self.data || {};
        self.data[id] = data;
        var ref = self.doc(id);
        ref.set(data).then(function() {
          resolve(ref);
        }).catch(reject);
      } else {
        reject(err);
      }
    });
  });
};

MockFirestoreCollection.prototype.doc = function (path) {
  assert(path, 'A child path is required');
  var parts = _.compact(path.split('/'));
  var childKey = parts.shift();
  var child = this.children[childKey];
  if (!child) {
    child = new this.DocumentReference(utils.mergePaths(this.path, childKey), this._childData(childKey), this, childKey, MockFirestoreCollection);
    this.children[child.id] = child;
  }
  if (parts.length > 0) {
    child = child.collection(parts.join('/'));
  }
  return child;
};

MockFirestoreCollection.prototype._hasChild = function (key) {
  return _.isObject(this.data) && _.has(this.data, key);
};

MockFirestoreCollection.prototype._childData = function (key) {
  return this._hasChild(key) ? this.data[key] : null;
};

MockFirestoreCollection.prototype._dataChanged = function (unparsedData) {
  this.data = utils.cleanFirestoreData(unparsedData);
};

function extractName(path) {
  return ((path || '').match(/\/([^.$\[\]#\/]+)$/) || [null, null])[1];
}

module.exports = MockFirestoreCollection;
