var MockFirebase = require('./firebase');

function MockFirebaseSdk(createDatabase, createAuth) {
  function MockFirebaseAuth() {
    var auth = createAuth ? createAuth() : new MockFirebase();
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
        return createDatabase ? createDatabase(path) : new MockFirebase(path);
      },
      refFromURL: function(url) {
        return createDatabase ? createDatabase(url) : new MockFirebase(url);
      }
    };
  }

  return {
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
}

module.exports = MockFirebaseSdk;
