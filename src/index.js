'use strict';

var MockFirestoreDeltaDocumentSnapshot = require('./firestore-delta-document-snapshot');


exports.MockFirebase = require('./firebase');
exports.MockFirebaseSdk = require('./sdk');
exports.MockFirestore = require('./firestore');
exports.DeltaDocumentSnapshot = MockFirestoreDeltaDocumentSnapshot.create;

/** @deprecated */
exports.MockFirebaseSimpleLogin = require('./login');
