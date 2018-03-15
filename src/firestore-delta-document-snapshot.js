'use strict';

var _ = require('./lodash');
var DocumentSnapshot = require('./firestore-document-snapshot');

function MockFirestoreDeltaDocumentSnapshot (id, data, previous, ref) {
  _.extend(this, DocumentSnapshot.prototype, new DocumentSnapshot(id, ref, data));
  this.previous = previous;
}

MockFirestoreDeltaDocumentSnapshot.create = function(app, data, delta, path) {
  var id = path.split('/').pop();
  var ref = app.firestore().doc(path);
  var previous = new MockFirestoreDeltaDocumentSnapshot(id, data, null, ref);
  return new MockFirestoreDeltaDocumentSnapshot(id, applyDelta(data, delta), previous, ref);
};

function applyDelta(data, delta) {
  if (data === null) {
    return delta;
  } else if (delta === null) {
    return null;
  } else if (typeof delta === 'string'|| typeof data === 'string') {
    return delta;
  } else {
    return Object.assign(data, delta);
  }
}

module.exports = MockFirestoreDeltaDocumentSnapshot;
