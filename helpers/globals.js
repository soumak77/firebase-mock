;(function (window) {
  'use strict';
  if (typeof window !== 'undefined' && window.firebasemock) {
    window.MockFirebase = window.firebasemock.MockFirebase;
    window.MockFirebaseSdk = window.firebasemock.MockFirebaseSdk;
    window.MockFirebaseSimpleLogin = window.firebasemock.MockFirebaseSimpleLogin;

    var originals = false;
    window.MockFirebase.override = function () {
      originals = {
        firebasesdk: window.firebase,
        firebase: window.Firebase,
        login: window.FirebaseSimpleLogin
      };
      window.firebase = window.firebasemock.MockFirebaseSdk();
      window.Firebase = window.firebasemock.MockFirebase;
      window.FirebaseSimpleLogin = window.firebasemock.MockFirebaseSimpleLogin;
    };
    window.MockFirebase.restore = function () {
      if (!originals) return;
      window.firebase = originals.firebasesdk;
      window.Firebase = originals.firebase;
      window.FirebaseSimpleLogin = originals.login;
    };
  }
})(window);
