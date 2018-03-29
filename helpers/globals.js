;(function (window) {
  'use strict';
  if (typeof window !== 'undefined' && window.firebasemock) {
    window.MockFirebase = window.firebasemock.MockFirebase;
    window.MockFirebaseSdk = window.firebasemock.MockFirebaseSdk;

    var originals = false;
    window.MockFirebase.override = function () {
      originals = {
        firebasesdk: window.firebase,
        firebase: window.Firebase,
      };
      window.firebase = window.firebasemock.MockFirebaseSdk();
      window.Firebase = window.firebasemock.MockFirebase;
    };
    window.MockFirebase.restore = function () {
      if (!originals) return;
      window.firebase = originals.firebasesdk;
      window.Firebase = originals.firebase;
    };
  }
})(window);
