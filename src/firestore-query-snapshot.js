'use strict';

var _ = require('./lodash');
var DocumentSnapshot = require('./firestore-document-snapshot');

function MockFirestoreQuerySnapshot (ref, data) {
  this._ref = ref;
  this.data = _.cloneDeep(data) || {};
  if (_.isObject(this.data) && _.isEmpty(this.data)) {
    this.data = {};
  }
  this.size = _.size(this.data);
  this.empty = this.size === 0;

  var self = this;
  this.docs = _.map(this.data, function (value, key) {
    return new DocumentSnapshot(key, self._ref.doc(key), value);
  });
}

MockFirestoreQuerySnapshot.prototype.forEach = function (callback, context) {
  var self = this;
  _.forEach(this.docs, function (doc) {
    callback.call(context, doc);
  });
};

module.exports = MockFirestoreQuerySnapshot;
