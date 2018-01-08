'use strict';

var _ = require('lodash');
var DocumentSnapshot = require('./firestore-document-snapshot');

function MockFirestoreQuerySnapshot (data) {
  this.data = _.cloneDeep(data) || {};
  if (_.isObject(this.data) && _.isEmpty(this.data)) {
    this.data = {};
  }
  this.size = _.size(this.data);
  this.empty = this.size === 0;

  this.docs = _.map(this.data, function (value, key) {
    new DocumentSnapshot(key, value);
  });
}

MockFirestoreQuerySnapshot.prototype.forEach = function (callback, context) {
  _.each(this.data, function (value, key) {
    callback.call(context, new DocumentSnapshot(key, value));
  });
};

module.exports = MockFirestoreQuerySnapshot;
