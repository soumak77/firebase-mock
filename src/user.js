'use strict';

var _ = require('./lodash');
var Promise = require('rsvp').Promise;

function MockFirebaseUser(ref, data) {
  this._auth = ref;
  this._idtoken = Math.random().toString();
  this.customClaims = {};
  this.uid = data.uid;
  this.email = data.email;
  this.password = data.password;
  this.phoneNumber = data.phoneNumber;
  this.displayName = data.displayName;
  this.photoURL = data.photoURL;
  this.emailVerified = !!data.emailVerified;
  this.isAnonymous = !!data.isAnonymous;
  this.metadata = data.metadata;
  this.providerData = data.providerData;
  this.providerId = data.providerId;
  this.refreshToken = data.refreshToken;
}

MockFirebaseUser.prototype.clone = function () {
  var user = new MockFirebaseUser(this._auth, this);
  user._idtoken = this._idtoken;
  user.customClaims = this.customClaims;
  return user;
};

MockFirebaseUser.prototype.delete = function () {
  return this._auth.deleteUser(this.uid);
};

MockFirebaseUser.prototype.reload = function () {
  var self = this;
  return new Promise(function(resolve, reject) {
    self._auth.getUser(self.uid).then(function(user) {
      self.email = user.email;
      self.displayName = user.displayName;
      self.phoneNumber = user.phoneNumber;
      self.emailVerified = !!user.emailVerified;
      self.isAnonymous = !!user.isAnonymous;
      self.metadata = user.metadata;
      self.photoURL = user.photoURL;
      self.providerData = user.providerData;
      self.providerId = user.providerId;
      self.refreshToken = user.refreshToken;
      self.customClaims = user.customClaims;
      self._idtoken = user._idtoken;
      resolve();
    }).catch(reject);
  });
};

MockFirebaseUser.prototype.updateEmail = function (newEmail) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self._auth.changeEmail({
      newEmail: newEmail,
      oldEmail: self.email,
      password: self.password
    }).then(function() {
      self.email = newEmail;
      resolve();
    }).catch(reject);
  });
};

MockFirebaseUser.prototype.updatePassword = function (newPassword) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self._auth.changePassword({
      email: self.email,
      oldPassword: self.password,
      newPassword: newPassword
    }).then(function() {
      self.password = newPassword;
      resolve();
    }).catch(reject);
  });
};

// Passing a null value will delete the current attribute's value, but not
// passing a property won't change the current attribute's value:
// Let's say we're using the same user than before, after the update.
MockFirebaseUser.prototype.updateProfile = function (profile) {
  if (!profile) return Promise.reject();
  var self = this;
  var user = _.find(this._auth._auth.users, function(u) {
    return u.uid === self.uid;
  });
  if (typeof profile.displayName !== 'undefined') {
    this.displayName = profile.displayName;
    user.displayName = profile.displayName;
  }
  if (typeof profile.photoURL !== 'undefined') {
    this.photoURL = profile.photoURL;
    user.photoURL = profile.photoURL;
  }
  return Promise.resolve();
};

MockFirebaseUser.prototype.getIdToken = function (forceRefresh) {
  var self = this;
  return new Promise(function(resolve) {
    if (forceRefresh) {
      self._idtoken = Math.random().toString();
    }
    resolve(self._idtoken);
  });
};

module.exports = MockFirebaseUser;
