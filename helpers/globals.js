;(function (window) {
  'use strict';
  if (typeof window !== 'undefined' && window.firebasemock) {
    window.MockFirebase = window.firebasemock.MockFirebase;
    window.MockFirebaseSimpleLogin = window.firebasemock.MockFirebaseSimpleLogin;

    var originals = false;
    window.MockFirebase.override = function () {
      originals = {
        firebase: window.Firebase,
        login: window.FirebaseSimpleLogin
      };
      window.Firebase = window.firebasemock.MockFirebase;
      window.FirebaseSimpleLogin = window.firebasemock.MockFirebaseSimpleLogin;
    };
    window.MockFirebase.restore = function () {
      if (!originals) return;
      window.Firebase = originals.firebase;
      window.FirebaseSimpleLogin = originals.login;
    };
  }
})(window);
