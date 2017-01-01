;(function (window) {
  'use strict';
  if (typeof window !== 'undefined' && window.firebasemock) {
    window.MockFirebase = window.firebasemock.MockFirebase;
    window.MockFirebaseSimpleLogin = window.firebasemock.MockFirebaseSimpleLogin;

    window.firebasemock.MockFirebaseSdk = {
      database: function() {
        return {
          ref: function(path) {
            return new window.firebasemock.MockFirebase(path);
          },
          refFromURL: function(url) {
            return new window.firebasemock.MockFirebase(url);
          }
        };
      },
      auth: function() {
        var auth = new window.firebasemock.MockFirebase();
        delete auth.ref;
        return auth;
      }
    };
    window.firebasemock.MockFirebaseSdk.auth.GoogleAuthProvider = function() {
      this.providerId = "google.com";
    };
    window.firebasemock.MockFirebaseSdk.auth.TwitterAuthProvider = function() {
      this.providerId = "twitter.com";
    };
    window.firebasemock.MockFirebaseSdk.auth.FacebookAuthProvider = function() {
      this.providerId = "facebook.com";
    };
    window.firebasemock.MockFirebaseSdk.auth.GithubAuthProvider = function() {
      this.providerId = "github.com";
    };

    var originals = false;
    window.MockFirebase.override = function () {
      originals = {
        firebasesdk: window.firebase,
        firebase: window.Firebase,
        login: window.FirebaseSimpleLogin
      };
      window.firebase = window.firebasemock.MockFirebaseSdk;
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
