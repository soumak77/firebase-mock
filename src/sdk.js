var MockFirebase = require('./firebase');

function MockFirebaseAuth() {
  var auth = new MockFirebase();
  delete auth.ref;
  return auth;
}
MockFirebaseAuth.GoogleAuthProvider = function() {
  this.providerId = "google.com";
};
MockFirebaseAuth.TwitterAuthProvider = function() {
  this.providerId = "twitter.com";
};
MockFirebaseAuth.FacebookAuthProvider = function() {
  this.providerId = "facebook.com";
};
MockFirebaseAuth.GithubAuthProvider = function() {
  this.providerId = "github.com";
};

function MockFirebaseDatabase() {
  return {
    ref: function(path) {
      return new MockFirebase(path);
    },
    refFromURL: function(url) {
      return new MockFirebase(url);
    }
  };
}

module.exports = {
  database: MockFirebaseDatabase,
  auth: MockFirebaseAuth,
  initializeApp: function() {
    return {
      database: MockFirebaseDatabase,
      auth: MockFirebaseAuth,
      messaging: function() {},
      storage: function() {}
    };
  }
};
