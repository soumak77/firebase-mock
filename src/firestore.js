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

MockFirestore.prototype.getAll = function(/* ...docs */) {
  var docs = Array.from(arguments);
  if (_.isEmpty(docs)) {
    throw new Error('Firestore.getAll: Function requires at least 1 argument.');
  }
  // ReadOptions is not honored but at least ignored
  if (!_.isUndefined(docs[docs.length - 1].fieldMask)) {
    docs.pop();
  }
  return Promise.all(
    docs.map(function(doc) {
      return doc.get();
    })
  );
};

MockFirestore.prototype.runTransaction = function(transFunc) {
  var batch = this.batch();
  batch.get = function(doc) {
    return doc.get();
  };
  return new Promise(function(resolve, reject) {
    Promise.resolve(transFunc(batch)).then(function(value) {
      batch
        .commit()
        .then(function () {
          resolve(value);
        })
        .catch(reject);
    }).catch(reject);
  });
};

var processBatchQueue = function (queue) {
  _.forEach(queue, function (queueItem) {
    var method = queueItem.method;
    var doc = queueItem.args[0];
    var data = queueItem.args[1];
    var opts = queueItem.args[2];

    if (method === 'set') {
      if (opts && opts.merge === true) {
        doc._update(data, { setMerge: true });
      } else {
        doc.set(data);
      }
    } else if (method === 'create') {
      doc.create(data);
    } else if (method === 'update') {
      doc.update(data);
    } else if (method === 'delete') {
      doc.delete();
    }
  });
};

MockFirestore.prototype.batch = function () {
  var self = this;
  var queue = [];
  var batch = {
    set: function(doc, data, opts) {
      queue.push({ method: 'set', args: [doc, data, opts] });
      return batch;
    },
    create: function(doc, data) {
      queue.push({ method: 'create', args: [doc, data] });
      return batch;
    },
    update: function(doc, data) {
      queue.push({ method: 'update', args: [doc, data] });
      return batch;
    },
    delete: function(doc) {
      queue.push({ method: 'delete', args: [doc] });
      return batch;
    },
    commit: function() {
      processBatchQueue(queue);
      if (self.queue.events.length > 0) {
        self.flush();
      }
      return Promise.resolve();
    }
  };
  return batch;
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
