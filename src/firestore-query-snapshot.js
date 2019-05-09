'use strict';

var _ = require('./lodash');
var DocumentSnapshot = require('./firestore-document-snapshot');

function MockFirestoreQuerySnapshot (ref, data, keyOrder) {
  this._ref = ref;
  this.data = _.cloneDeep(data) || {};
  this.keyOrder = keyOrder;
  if (_.isObject(this.data) && _.isEmpty(this.data)) {
    this.data = {};
  }
  this.size = _.size(this.keyOrder);
  this.empty = this.size === 0;

  var self = this;
  this.docs = _.map(keyOrder, function (key) {
    return new DocumentSnapshot(key, self._ref.doc(key), self.data[key]);
  });
}

MockFirestoreQuerySnapshot.prototype.forEach = function (callback, context) {
  _.forEach(this.docs, function (doc) {
    callback.call(context, doc);
  });
};

module.exports = MockFirestoreQuerySnapshot;
