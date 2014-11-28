;(function (window) {
  'use strict';
  if (typeof window !== 'undefined' && window.mockfirebase) {
    window.MockFirebase = window.mockfirebase.MockFirebase;
    window.MockFirebaseSimpleLogin = window.mockfirebase.MockFirebaseSimpleLogin;

    var originals = false;
    window.MockFirebase.override = function () {
      originals = {
        firebase: window.Firebase,
        login: window.FirebaseSimpleLogin
      };
      window.Firebase = window.mockfirebase.MockFirebase;
      window.FirebaseSimpleLogin = window.mockfirebase.MockFirebaseSimpleLogin;
    };
    window.MockFirebase.restore = function () {
      if (!originals) return;
      window.Firebase = originals.firebase;
      window.FirebaseSimpleLogin = originals.login;
    };
  }
})(window);
