;(function (window) {
  'use strict';
  if (typeof window !== 'undefined' && window.mockfirebase) {
    window.MockFirebase = window.mockfirebase.MockFirebase;
    window.MockFirebaseSimpleLogin = window.mockfirebase.MockFirebaseSimpleLogin;

    window.mockfirebase.MockFirebaseSdk = {
      database: function() {
        return {
          ref: function(path) {
            return new window.mockfirebase.MockFirebase(path);
          },
          refFromURL: function(url) {
            return new window.mockfirebase.MockFirebase(url);
          }
        };
      },
      auth: function() {
        var auth = new window.mockfirebase.MockFirebase();
        delete auth.ref;
        return auth;
      }
    };
    window.mockfirebase.MockFirebaseSdk.auth.GoogleAuthProvider = function() {
      this.providerId = "google.com";
    };
    window.mockfirebase.MockFirebaseSdk.auth.TwitterAuthProvider = function() {
      this.providerId = "twitter.com";
    };
    window.mockfirebase.MockFirebaseSdk.auth.FacebookAuthProvider = function() {
      this.providerId = "facebook.com";
    };
    window.mockfirebase.MockFirebaseSdk.auth.GithubAuthProvider = function() {
      this.providerId = "github.com";
    };

    var originals = false;
    window.MockFirebase.override = function () {
      originals = {
        firebasesdk: window.firebase,
        firebase: window.Firebase,
        login: window.FirebaseSimpleLogin
      };
      window.firebase = window.mockfirebase.MockFirebaseSdk;
      window.Firebase = window.mockfirebase.MockFirebase;
      window.FirebaseSimpleLogin = window.mockfirebase.MockFirebaseSimpleLogin;
    };
    window.MockFirebase.restore = function () {
      if (!originals) return;
      window.firebase = originals.firebasesdk;
      window.Firebase = originals.firebase;
      window.FirebaseSimpleLogin = originals.login;
    };
  }
})(window);
