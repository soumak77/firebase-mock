'use strict';

var MockFirebase = exports.MockFirebase = require('./firebase');
var MockFirebaseSimpleLogin = exports.MockFirebaseSimpleLogin = require('./login');

var originals;
exports.override = function () {
  /* global window */
  if (typeof window !== 'undefined') {
    originals = {
      firebase: window.Firebase,
      login: window.FirebaseSimpleLogin
    };
    window.Firebase = MockFirebase;
    window.FirebaseSimpleLogin = MockFirebaseSimpleLogin;
  }
  else {
    console.warn('MockFirebase.override is only useful in a browser environment.');
  }
};
