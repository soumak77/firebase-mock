'use strict';

var _ = require('lodash');
var assert = require('assert');
var Promise = require('rsvp').Promise;
var autoId = require('firebase-auto-ids');
var QuerySnapshot = require('./firestore-query-snapshot');
var Queue = require('./queue').Queue;
var utils = require('./utils');
var validate = require('./validators');

function MockFirestoreQuery(path, data, parent, name) {
  this.ref = this;
  this.path = path || 'Mock://';
  this.errs = {};
  this.priority = null;
  this.myName = parent ? name : extractName(path);
  this.key = this.myName;
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
  this.orderedProperties = [];
  this.orderedDirections = [];
  this.limited = 0;
  this.data = utils.cleanData(_.cloneDeep(data) || null);
}

MockFirestoreQuery.prototype.flush = function (delay) {
  this.queue.flush(delay);
  return this;
};

MockFirestoreQuery.prototype.autoFlush = function (delay) {
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

MockFirestoreQuery.prototype.getFlushQueue = function () {
  return this.queue.getEvents();
};

MockFirestoreQuery.prototype.getData = function () {
  return _.cloneDeep(this.data);
};

MockFirestoreQuery.prototype.toString = function () {
  return this.path;
};

MockFirestoreQuery.prototype.get = function () {
  var err = this._nextErr('get');
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('get', _.toArray(arguments), function () {
      var results = {};
      var limit = 0;

      if (err === null) {
        if (_.size(this.data) !== 0) {
          if (this.orderedProperties.length === 0) {
            _.forEach(this.data, function(data, key) {
              if (self.limited <= 0 || limit < self.limited) {
                results[key] = _.cloneDeep(data);
                limit++;
              }
            });
            resolve(new QuerySnapshot(results));
          } else {
            var queryable = [];
            _.forEach(this.data, function(data, key) {
              queryable.push({
                data: data,
                key: key
              });
            });

            queryable = _.sortByOrder(queryable, _.map(this.orderedProperties, function(p) { return 'data.' + p; }), this.orderedDirections);

            queryable.forEach(function(q) {
              if (self.limited <= 0 || limit < self.limited) {
                results[q.key] = _.cloneDeep(q.data);
                limit++;
              }
            });

            resolve(new QuerySnapshot(results));
          }
        } else {
          resolve(new QuerySnapshot());
        }

        resolve(new QuerySnapshot(this.getData()));
      } else {
        reject(err);
      }
    });
  });
};

MockFirestoreQuery.prototype.where = function (property, operator, value) {
  var query;

  // check if unsupported operator
  if (operator !== '==') {
    console.log('Using unsupported where() operator for firebase-mock, returning entire dataset');
    return this;
  } else {
    if (_.size(this.data) !== 0) {
      var results = {};
      _.forEach(this.data, function(data, key) {
        switch (operator) {
          case '==':
            if (data[property] === value) {
              results[key] = _.cloneDeep(data);
            }
            break;
          default:
            results[key] = _.cloneDeep(data);
            break;
        }
      });
      return new MockFirestoreQuery(this.path, results, this.parent, this.myName);
    } else {
      return new MockFirestoreQuery(this.path, null, this.parent, this.myName);
    }
  }
};

MockFirestoreQuery.prototype.orderBy = function (property, direction) {
  var query = new MockFirestoreQuery(this.path, this.getData(), this.parent, this.myName);
  query.orderedProperties.push(property);
  query.orderedDirections.push(direction || 'asc');
  return query;
};

MockFirestoreQuery.prototype.limit = function (limit) {
  var query = new MockFirestoreQuery(this.path, this.getData(), this.parent, this.myName);
  query.limited = limit;
  return query;
};

MockFirestoreQuery.prototype._defer = function (sourceMethod, sourceArgs, callback) {
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

MockFirestoreQuery.prototype._nextErr = function (type) {
  var err = this.errs[type];
  delete this.errs[type];
  return err || null;
};

function extractName(path) {
  return ((path || '').match(/\/([^.$\[\]#\/]+)$/) || [null, null])[1];
}

module.exports = MockFirestoreQuery;
