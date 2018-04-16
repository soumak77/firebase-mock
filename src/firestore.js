'use strict';

var _ = require('./lodash');
var assert = require('assert');
var Promise = require('rsvp').Promise;
var CollectionReference = require('./firestore-collection');
var DocumentReference = require('./firestore-document');
var FieldValue = require('./firestore-field-value');
var Queue = require('./queue').Queue;
var utils = require('./utils');
var validate = require('./validators');
var DEFAULT_PATH = 'Mock://';

function MockFirestore(path, data, parent, name) {
  this.ref = this;
  this.firestore = this;
  this.path = path || DEFAULT_PATH;
  this.errs = {};
  this.priority = null;
  this.id = parent ? name : extractName(path);
  this.flushDelay = parent ? parent.flushDelay : false;
  this.queue = parent ? parent.queue : new Queue();
  this.parent = parent || null;
  this.children = {};
  if (parent) parent.children[this.key] = this;
  this.data = _.cloneDeep(data) || null;
}

MockFirestore.FieldValue = FieldValue;

MockFirestore.prototype.flush = function (delay) {
  this.queue.flush(delay);
  return this;
};

MockFirestore.prototype.autoFlush = function (delay) {
  if (_.isUndefined(delay)) {
    delay = true;
  }
  if (this.flushDelay !== delay) {
    this.flushDelay = delay;
    _.forEach(this.children, function (child) {
      child.autoFlush(delay);
    });
    if (this.parent) {
      this.parent.autoFlush(delay);
    }
  }
  return this;
};

MockFirestore.prototype.getFlushQueue = function () {
  return this.queue.getEvents();
};

MockFirestore.prototype.toString = function () {
  return this.path;
};

MockFirestore.prototype.runTransaction = function(transFunc) {
  var batch = this.batch();
  batch.get = function(doc) {
    return doc.get();
  };
  return new Promise(function(resolve, reject) {
    transFunc(batch).then(function() {
      batch.commit().then(resolve).catch(reject);
    }).catch(reject);
  });
};

MockFirestore.prototype.batch = function () {
  var self = this;
  return {
    set: function(doc, data, opts) {
      var _opts = _.assign({}, { merge: false }, opts);
      if (_opts.merge) {
        doc._update(data, { setMerge: true });
      }
      else {
        doc.set(data);
      }
    },
    update: function(doc, data) {
      doc.update(data);
    },
    delete: function(doc) {
      doc.delete();
    },
    commit: function() {
      if (self.queue.events.length > 0) {
        self.flush();
      }
      return Promise.resolve();
    }
  };
};

MockFirestore.prototype.collection = function (path) {
  return this._child(path, false);
};

MockFirestore.prototype.doc = function (path) {
  return this._child(path, true);
};

MockFirestore.prototype._child = function (childPath, findingDoc) {
  assert(childPath, 'A child path is required');
  var parts = _.compact(childPath.split('/'));
  var totalParts = parts.length;
  var childKey = parts.shift();
  var child = this.children[childKey];
  if (!child) {
    var firstChildIsDoc;
    if (findingDoc) {
      // if we are finding a doc from the root, we know the first child must be
      // a doc if we have an ODD amount of parts in the path
      //    example: db.collection().doc() // totalParts == 2
      //    example: db.doc().collection().doc() // totalParts == 3
      firstChildIsDoc = totalParts % 2 === 1;
    } else {
      // if we are finding a collection from the root, we know the first child must be
      // a doc if we have an EVEN amount of parts in the path
      //    example: db.collection().doc().collection() // totalParts == 3
      //    example: db.doc().collection() // totalParts == 2
      firstChildIsDoc = totalParts % 2 === 0;
    }

    if (firstChildIsDoc) {
      child = new DocumentReference(this.path === DEFAULT_PATH ? childKey : utils.mergePaths(this.path, childKey), this._childData(childKey), this, childKey, CollectionReference);
    } else {
      child = new CollectionReference(this.path === DEFAULT_PATH ? childKey : utils.mergePaths(this.path, childKey), this._childData(childKey), this, childKey, DocumentReference);
    }

    this.children[child.id] = child;
  }

  if (parts.length > 0) {
    if (child instanceof DocumentReference) {
      child = child.collection(parts.join('/'));
    } else {
      child = child.doc(parts.join('/'));
    }
  }

  return child;
};

MockFirestore.prototype._hasChild = function (key) {
  return _.isObject(this.data) && _.has(this.data, key);
};

MockFirestore.prototype._childData = function (key) {
  return this._hasChild(key) ? this.data[key] : null;
};

MockFirestore.prototype._defer = function (sourceMethod, sourceArgs, callback) {
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

MockFirestore.prototype._nextErr = function (type) {
  var err = this.errs[type];
  delete this.errs[type];
  return err || null;
};

function extractName(path) {
  return ((path || '').match(/\/([^.$\[\]#\/]+)$/) || [null, null])[1];
}

module.exports = MockFirestore;
