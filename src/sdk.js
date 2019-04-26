var MockAuthentication = require('./auth');
var MockFirebase = require('./firebase');
var MockFirestore = require('./firestore');
var MockFieldValue = require('./firestore-field-value');
var MockMessaging = require('./messaging');
var MockStorage = require('./storage');
var MockTimestamp = require('./timestamp');

var EmailAuthProvider = function() {
  this.providerId = EmailAuthProvider.PROVIDER_ID;
};
EmailAuthProvider.PROVIDER_ID = "password";
EmailAuthProvider.credential = function() {
  return new AuthCredential(EmailAuthProvider.PROVIDER_ID);
};

var GoogleAuthProvider = function() {
  this.providerId = GoogleAuthProvider.PROVIDER_ID;
};
GoogleAuthProvider.PROVIDER_ID = "google.com";
GoogleAuthProvider.credential = function() {
  return new AuthCredential(GoogleAuthProvider.PROVIDER_ID);
};

var TwitterAuthProvider = function() {
  this.providerId = TwitterAuthProvider.PROVIDER_ID;
};
TwitterAuthProvider.PROVIDER_ID = "twitter.com";
TwitterAuthProvider.credential = function() {
  return new AuthCredential(TwitterAuthProvider.PROVIDER_ID);
};

var FacebookAuthProvider = function() {
  this.providerId = FacebookAuthProvider.PROVIDER_ID;
};
FacebookAuthProvider.PROVIDER_ID = "facebook.com";
FacebookAuthProvider.credential = function() {
  return new AuthCredential(FacebookAuthProvider.PROVIDER_ID);
};

var GithubAuthProvider = function() {
  this.providerId = GithubAuthProvider.PROVIDER_ID;
};
GithubAuthProvider.PROVIDER_ID = "github.com";
GithubAuthProvider.credential = function() {
  return new AuthCredential(GithubAuthProvider.PROVIDER_ID);
};

var AuthCredential = function(provider) {
  this.providerId = provider;
};

function MockFirebaseSdk(createDatabase, createAuth, createFirestore, createStorage, createMessaging) {
  function MockFirebaseAuth() {
    var auth = createAuth ? createAuth() : new MockAuthentication();
    delete auth.ref;
    return auth;
  }
  MockFirebaseAuth.EmailAuthProvider = EmailAuthProvider;
  MockFirebaseAuth.GoogleAuthProvider = GoogleAuthProvider;
  MockFirebaseAuth.TwitterAuthProvider = TwitterAuthProvider;
  MockFirebaseAuth.FacebookAuthProvider = FacebookAuthProvider;
  MockFirebaseAuth.GithubAuthProvider = GithubAuthProvider;

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
  MockFirebaseDatabase.ServerValue = MockFirebase.ServerValue;

  function MockFirebaseFirestore() {
    return createFirestore ? createFirestore() : new MockFirestore();
  }
  MockFirebaseFirestore.FieldValue = MockFieldValue;
  MockFirebaseFirestore.Timestamp = MockTimestamp;

  function MockFirebaseStorage() {
    return createStorage ? createStorage() : new MockStorage();
  }

  function MockFirebaseMessaging() {
    return createMessaging ? createMessaging() : new MockMessaging();
  }

  return {
    database: MockFirebaseDatabase,
    auth: MockFirebaseAuth,
    firestore: MockFirebaseFirestore,
    storage: MockFirebaseStorage,
    messaging: MockFirebaseMessaging,
    initializeApp: function() {
      return {
        database: MockFirebaseDatabase,
        auth: MockFirebaseAuth,
        firestore: MockFirebaseFirestore,
        storage: MockFirebaseStorage,
        messaging: MockFirebaseMessaging
      };
    }
  };
}

module.exports = MockFirebaseSdk;
