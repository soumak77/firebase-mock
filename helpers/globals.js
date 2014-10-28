;(function (window) {
  'use strict';
  if (typeof window !== 'undefined' && window.mockfirebase) {
    window.MockFirebase = window.mockfirebase.MockFirebase;
    window.MockFirebaseSimpleLogin = window.mockfirebase.MockFirebaseSimpleLogin;
  }
})(window);
