'use strict';

var _ = require('lodash');
var assert = require('assert');
var Promise = require('rsvp').Promise;
var autoId = require('firebase-auto-ids');
var DocumentSnapshot = require('./firestore-document-snapshot');
var Queue = require('./queue').Queue;
var utils = require('./utils');
var validate = require('./validators');

function MockFirestoreDocument(path, data, parent, name, CollectionReference) {
  this.ref = this;
  this.path = path || 'Mock://';
  this.CollectionReference = CollectionReference;
  this.errs = {};
  this.id = parent ? name : extractName(path);
  this.flushDelay = parent ? parent.flushDelay : false;
  this.queue = parent ? parent.queue : new Queue();
  this.parent = parent || null;
  this.children = {};
  if (parent) parent.children[this.id] = this;
  this.data = null;
  this._dataChanged(_.cloneDeep(data) || null);
}

MockFirestoreDocument.prototype.flush = function (delay) {
  this.queue.flush(delay);
  return this;
};

MockFirestoreDocument.prototype.autoFlush = function (delay) {
  if (_.isUndefined(delay)) {
    delay = true;
  }
  if (this.flushDelay !== delay) {
    this.flushDelay = delay;
    _.each(this.children, function (child) {
      child.autoFlush(delay);
    });
    if (this.parent) {
      this.parent.autoFlush(delay);
    }
  }
  return this;
};

MockFirestoreDocument.prototype.getFlushQueue = function () {
  return this.queue.getEvents();
};

MockFirestoreDocument.prototype.getData = function () {
  return _.cloneDeep(this.data);
};

MockFirestoreDocument.prototype.toString = function () {
  return this.path;
};

MockFirestoreDocument.prototype.collection = function (path) {
  assert(path, 'A child path is required');
  var parts = _.compact(path.split('/'));
  var childKey = parts.shift();
  var child = this.children[childKey];
  if (!child) {
    child = new this.CollectionReference(utils.mergePaths(this.path, childKey), this._childData(childKey), this, childKey, MockFirestoreDocument);
    this.children[child.id] = child;
  }
  if (parts.length > 0) {
    child = child.doc(parts.join('/'));
  }
  return child;
};

MockFirestoreDocument.prototype.get = function () {
  var err = this._nextErr('get');
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('get', _.toArray(arguments), function () {
      if (err === null) {
        resolve(new DocumentSnapshot(self.id, self.ref, self.getData()));
      } else {
        reject(err);
      }
    });
  });
};

MockFirestoreDocument.prototype.set = function (data, callback) {
  var err = this._nextErr('set');
  data = _.cloneDeep(data);
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('set', _.toArray(arguments), function () {
      if (err === null) {
        self._dataChanged(data);
        resolve();
      } else {
        if (callback) {
          callback(err);
        }
        reject(err);
      }
    });
  });
};

MockFirestoreDocument.prototype.update = function (changes, callback) {
  assert.equal(typeof changes, 'object', 'First argument must be an object when calling "update"');
  var err = this._nextErr('update');
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('update', _.toArray(arguments), function () {
      if (!err) {
        var base = self.getData();
        var data = _.merge(_.isObject(base) ? base : {}, utils.updateToObject(changes));
        data = utils.removeEmptyProperties(data);
        self._dataChanged(data);
        resolve(data);
      } else {
        if (callback) {
          callback(err);
        }
        reject(err);
      }
    });
  });
};

MockFirestoreDocument.prototype.delete = function (callback) {
  var err = this._nextErr('delete');
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('delete', _.toArray(arguments), function () {
      if (callback) callback(err);
      if (err === null) {
        self._dataChanged(null);
        resolve(null);
      } else {
        reject(err);
      }
    });
  });
};

MockFirestoreDocument.prototype._hasChild = function (key) {
  return _.isObject(this.data) && _.has(this.data, key);
};

MockFirestoreDocument.prototype._childData = function (key) {
  return this._hasChild(key) ? this.data[key] : null;
};

MockFirestoreDocument.prototype._dataChanged = function (unparsedData) {
  this.data = utils.cleanFirestoreData(unparsedData);
  if (this.parent) {
    if (this.data) {
      this.parent.data = this.parent.data || {};
      this.parent.data[this.id] = this.data;
    } else {
      if (this.parent.data) {
        delete this.parent.data[this.id];
      }
      if (utils.cleanFirestoreData(this.parent.data) === null) {
        this.parent.data = null;
      }
    }
  }
};

MockFirestoreDocument.prototype._defer = function (sourceMethod, sourceArgs, callback) {
  this.queue.push({
    fn: callback,
    context: this,
    sourceData: {
      ref: this,
      method: sourceMethod,
      args: sourceArgs
    }
  });
  if (this.flushDelay !== false) {
    this.flush(this.flushDelay);
  }
};

MockFirestoreDocument.prototype._nextErr = function (type) {
  var err = this.errs[type];
  delete this.errs[type];
  return err || null;
};

function extractName(path) {
  return ((path || '').match(/\/([^.$\[\]#\/]+)$/) || [null, null])[1];
}

module.exports = MockFirestoreDocument;
