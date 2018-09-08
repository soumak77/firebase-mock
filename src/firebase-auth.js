'use strict';

var _      = require('./lodash');
var format = require('util').format;
var Promise   = require('rsvp').Promise;
var User = require('./user');

function FirebaseAuth () {
  this.currentUser = null;
  this._auth = {
    listeners: [],
    completionListeners: [],
    users: [],
    uidCounter: 1
  };
}

FirebaseAuth.prototype.changeAuthState = function (userData) {
  this._defer('changeAuthState', _.toArray(arguments), function() {
    if (!_.isEqual(this.currentUser, userData)) {
      this.currentUser = _.isObject(userData) ? userData : null;
      this._triggerAuthEvent();
    }
  });
};

FirebaseAuth.prototype.onAuthStateChanged = function (callback) {
  var self = this;
  var currentUser = this.currentUser;
  this._auth.listeners.push({fn: callback});

  defer();
  return destroy;

  function destroy() {
    self.offAuth(callback);
  }

  function defer() {
    self._defer('onAuthStateChanged', _.toArray(arguments), function() {
      if (!_.isEqual(self.currentUser, currentUser)) {
        self._triggerAuthEvent();
      }
    });
  }
};

FirebaseAuth.prototype.getUserByEmail = function (email, onComplete) {
  var err = this._nextErr('getUserByEmail');
  var self = this;
  return new Promise(function (resolve, reject) {
    var user = null;
    err = err || self._validateExistingEmail(email);
    if (!err) {
      user = _.find(self._auth.users, function(u) {
        return u.email === email;
      });
      if (onComplete) {
        onComplete(err, user.clone());
      }
      resolve(user.clone());
    } else {
      if (onComplete) {
        onComplete(err, null);
      }
      reject(err);
    }
  });
};

FirebaseAuth.prototype.getUser = function (uid, onComplete) {
  var err = this._nextErr('getUser');
  var self = this;
  return new Promise(function (resolve, reject) {
    var user = null;
    err = err || self._validateExistingUid(uid);
    if (!err) {
      user = _.find(self._auth.users, function(u) {
        return u.uid == uid;
      });
      if (onComplete) {
        onComplete(err, user.clone());
      }
      resolve(user.clone());
    } else {
      if (onComplete) {
        onComplete(err, null);
      }
      reject(err);
    }
  });
};

// number of arguments
var authMethods = {
  authWithCustomToken: 2,
  authAnonymously: 1,
  authWithPassword: 2,
  authWithOAuthPopup: 2,
  authWithOAuthRedirect: 2,
  authWithOAuthToken: 3
};

Object.keys(authMethods)
  .forEach(function (method) {
    var length = authMethods[method];
    var callbackIndex = length - 1;
    FirebaseAuth.prototype[method] = function () {
      this._authEvent(method, arguments[callbackIndex]);
    };
  });

var signinMethods = {
  signInWithCustomToken: function(authToken) {
    return {
      isAnonymous: false
    };
  },
  signInAnonymously: function() {
    return {
      isAnonymous: true
    };
  },
  signInWithEmailAndPassword: function(email, password) {
    return {
      isAnonymous: false,
      email: email
    };
  },
  signInWithPopup: function(provider) {
    return {
      isAnonymous: false,
      providerData: [provider]
    };
  },
  signInWithRedirect: function(provider) {
    return {
      isAnonymous: false,
      providerData: [provider]
    };
  },
  signInWithCredential: function(credential) {
    return {
      isAnonymous: false
    };
  }
};

Object.keys(signinMethods)
  .forEach(function (method) {
    var getUser = signinMethods[method];
    FirebaseAuth.prototype[method] = function () {
      var self = this;
      var user = getUser.apply(this, arguments);
      var promise = new Promise(function(resolve, reject) {
        self._authEvent(method, function(err) {
          if (err) reject(err);
          self.currentUser = user;
          resolve(user);
          self._triggerAuthEvent();
        }, true);
      });
      return promise;
    };
  });

FirebaseAuth.prototype.auth = function (token, callback) {
  console.warn('FIREBASE WARNING: FirebaseRef.auth() being deprecated. Please use FirebaseRef.authWithCustomToken() instead.');
  this._authEvent('auth', callback);
};

FirebaseAuth.prototype._authEvent = function (method, callback, defercallback) {
  var err = this._nextErr(method);
  if (!callback) return;
  if (err) {
    // if an error occurs, we defer the error report until the next flush()
    // event is triggered
    this._defer('_authEvent', _.toArray(arguments), function() {
      callback(err, null);
    });
  }
  else {
    if (defercallback) {
      this._defer(method, _.toArray(arguments), function() {
        callback();
      });
    } else {
      // if there is no error, then we just add our callback to the listener
      // stack and wait for the next changeAuthState() call.
      this._auth.completionListeners.push({fn: callback});
    }
  }
};

FirebaseAuth.prototype._triggerAuthEvent = function () {
  var completionListeners = this._auth.completionListeners;
  this._auth.completionListeners = [];
  var user = this.currentUser;
  completionListeners.forEach(function (parts) {
    parts.fn.call(parts.context, null, _.cloneDeep(user));
  });
  var listeners = _.cloneDeep(this._auth.listeners);
  listeners.forEach(function (parts) {
    parts.fn.call(parts.context, _.cloneDeep(user));
  });
};

FirebaseAuth.prototype.getAuth = function () {
  return this.currentUser;
};

FirebaseAuth.prototype.onAuth = function (onComplete, context) {
  this._auth.listeners.push({
    fn: onComplete,
    context: context
  });
  onComplete.call(context, this.getAuth());
};

FirebaseAuth.prototype.offAuth = function (onComplete, context) {
  var index = _.findIndex(this._auth.listeners, function (listener) {
    return listener.fn === onComplete && listener.context === context;
  });
  if (index > -1) {
    this._auth.listeners.splice(index, 1);
  }
};

FirebaseAuth.prototype.unauth = function () {
  if (this.currentUser !== null) {
    this.currentUser = null;
    this._triggerAuthEvent();
  }
};

FirebaseAuth.prototype.signOut = function () {
  var self = this, updateuser = this.currentUser !== null;
  var promise = new Promise(function(resolve, reject) {
    self._authEvent('signOut', function(err) {
      if (err) reject(err);
      self.currentUser = null;
      resolve();

      if (updateuser) {
        self._triggerAuthEvent();
      }
    }, true);
  });
  return promise;
};

FirebaseAuth.prototype.createUserWithEmailAndPassword = function (email, password) {
  return this._createUser('createUserWithEmailAndPassword', {
    email: email,
    password: password
  });
};

FirebaseAuth.prototype.createUser = function (credentials, onComplete) {
  validateCredentials('createUser', credentials, [
    'email'
  ]);
  return this._createUser('createUser', credentials, onComplete);
};

FirebaseAuth.prototype._createUser = function (method, credentials, onComplete) {
  var err = this._nextErr(method);
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer(method, _.toArray(arguments), function () {
      var user = null;
      err = err || self._validateNewEmail(credentials.email);
      err = err || self._validateNewUid(credentials.uid);
      if (!err) {
        user = new User(this, {
          uid: credentials.uid || self._nextUid(),
          email: credentials.email,
          password: credentials.password,
          phoneNumber: credentials.phoneNumber,
          emailVerified: credentials.emailVerified,
          displayName: credentials.displayName,
          photoURL: credentials.photoURL
        });
        self._auth.users.push(user);
        if (onComplete) {
          onComplete(err, user.clone());
        }
        resolve(user.clone());
      } else {
        if (onComplete) {
          onComplete(err, null);
        }
        reject(err);
      }
    });
  });
};

FirebaseAuth.prototype.changeEmail = function (credentials, onComplete) {
  validateCredentials('changeEmail', credentials, [
    'oldEmail',
    'newEmail',
    'password'
  ]);
  var err = this._nextErr('changeEmail');
  var self = this;
  return new Promise(function(resolve, reject) {
    self._defer('changeEmail', _.toArray(arguments), function () {
      err = err ||
        self._validateExistingEmail(credentials.oldEmail) ||
        self._validPass(credentials.oldEmail, credentials.password);
      if (!err) {
        var user = _.find(self._auth.users, function(u) {
          return u.email === credentials.oldEmail;
        });
        user.email = credentials.newEmail;
        if (onComplete) {
          onComplete(err);
        }
        resolve();
      } else {
        if (onComplete) {
          onComplete(err);
        }
        reject(err);
      }
    });
  });
};

FirebaseAuth.prototype.changePassword = function (credentials, onComplete) {
  validateCredentials('changePassword', credentials, [
    'email',
    'oldPassword',
    'newPassword'
  ]);
  var err = this._nextErr('changePassword');
  var self = this;
  return new Promise(function(resolve, reject) {
    self._defer('changePassword', _.toArray(arguments), function () {
      err = err ||
        self._validateExistingEmail(credentials.email) ||
        self._validPass(credentials.email, credentials.oldPassword);
      if (!err) {
        var user = _.find(self._auth.users, function(u) {
          return u.email === credentials.email;
        });
        user.password = credentials.newPassword;
        if (onComplete) {
          onComplete(err);
        }
        resolve();
      } else {
        if (onComplete) {
          onComplete(err);
        }
        reject(err);
      }
    });
  });
};

FirebaseAuth.prototype.deleteUser = function (uid) {
  var err = this._nextErr('deleteUser');
  var self = this;
  return new Promise(function(resolve, reject) {
    self._defer('deleteUser', _.toArray(arguments), function () {
      if (!err) {
        _.remove(self._auth.users, function(u) {
          return u.uid === uid;
        });

        if (self.currentUser && self.currentUser.uid === uid) {
          self.currentUser = null;
        }
        resolve();
      } else {
        reject(err);
      }
    });
  });
};

FirebaseAuth.prototype.removeUser = function (credentials, onComplete) {
  validateCredentials('removeUser', credentials, [
    'email',
    'password'
  ]);
  var err = this._nextErr('removeUser');
  var self = this;
  return new Promise(function(resolve, reject) {
    self._defer('removeUser', _.toArray(arguments), function () {
      err = err ||
        self._validateExistingEmail(credentials.email) ||
        self._validPass(credentials.email, credentials.password);
      if (!err) {
        _.remove(self._auth.users, function(u) {
          return u.email === credentials.email;
        });
        if (onComplete) {
          onComplete(err);
        }
        resolve();
      } else {
        if (onComplete) {
          onComplete(err);
        }
        reject(err);
      }
    });
  });
};

FirebaseAuth.prototype.resetPassword = function (credentials, onComplete) {
  validateCredentials('resetPassword', credentials, [
    'email'
  ]);
  var err = this._nextErr('resetPassword');
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('resetPassword', _.toArray(arguments), function() {
      err = err ||
        self._validateExistingEmail(credentials.email);
      if (!err) {
        if (onComplete) {
          onComplete(err);
        }
        resolve();
      } else {
        if (onComplete) {
          onComplete(err);
        }
        reject(err);
      }
    });
  });
};

FirebaseAuth.prototype.verifyIdToken = function (token) {
  var err = this._nextErr('verifyIdToken');
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('verifyIdToken', _.toArray(arguments), function() {
      if (err) {
        reject(err);
      } else {
        var user = _.find(self._auth.users, function(u) {
          return u._idtoken === token;
        });
        if (!user) {
          reject(new Error('Cannot verify token'));
        } else {
          var customClaims = _.clone(user.customClaims);
          customClaims.uid = user.uid;
          customClaims.email = user.email;
          customClaims.email_verified = user.emailVerified;
          resolve(customClaims);
        }
      }
    });
  });
};

FirebaseAuth.prototype.setCustomUserClaims = function (uid, claims) {
  var err = this._nextErr('setCustomUserClaims');
  var self = this;
  return new Promise(function (resolve, reject) {
    self._defer('setCustomUserClaims', _.toArray(arguments), function() {
      err = err || self._validateExistingUid(uid);
      if (err) {
        reject(err);
      } else {
        var user = _.find(self._auth.users, function(u) {
          return u.uid === uid;
        });
        user.customClaims = Object.assign({}, user.customClaims, claims);
        resolve();
      }
    });
  });
};

FirebaseAuth.prototype._nextUid = function () {
  return 'simplelogin:' + (this._auth.uidCounter++);
};

FirebaseAuth.prototype._validateNewUid = function (uid) {
  if (uid) {
    var user = _.find(this._auth.users, function(user) {
      return user.uid == uid;
    });
    if (user) {
      var err = new Error('The provided uid is already in use by an existing user. Each user must have a unique uid.');
      err.code = 'auth/uid-already-exists';
      return err;
    }
  }
  return null;
};

FirebaseAuth.prototype._validateExistingUid = function (uid) {
  if (uid) {
    var user = _.find(this._auth.users, function(user) {
      return user.uid == uid;
    });
    if (!user) {
      var err = new Error('There is no existing user record corresponding to the provided identifier.');
      err.code = 'auth/user-not-found';
      return err;
    }
  }
  return null;
};

FirebaseAuth.prototype._validateNewEmail = function (email) {
  var user = _.find(this._auth.users, function(u) {
    return u.email === email;
  });
  if (user) {
    var err = new Error('The provided email is already in use by an existing user. Each user must have a unique email.');
    err.code = 'auth/email-already-exists';
    return err;
  }
  return null;
};

FirebaseAuth.prototype._validateExistingEmail = function (email) {
  var user = _.find(this._auth.users, function(u) {
    return u.email === email;
  });
  if (!user) {
    var err = new Error('There is no existing user record corresponding to the provided identifier.');
    err.code = 'auth/user-not-found';
    return err;
  }
  return null;
};

FirebaseAuth.prototype._validPass = function (email, pass) {
  var err = null;
  var user = _.find(this._auth.users, function(u) {
    return u.email === email;
  });
  if (pass !== user.password) {
    err = new Error('The provided value for the password user property is invalid. It must be a string with at least six characters.');
    err.code = 'auth/invalid-password';
  }
  return err;
};

function validateCredentials (method, credentials, fields) {
  validateObject(credentials, method, 'First');
  fields.forEach(function (field) {
    validateArgument(method, credentials, 'First', field, 'string');
  });
}

function validateObject (object, method, position) {
  if (!_.isObject(object)) {
    throw new Error(format(
      'Firebase.%s failed: %s argument must be a valid object.',
      method,
      position
    ));
  }
}

function validateArgument (method, object, position, name, type) {
  if (!object.hasOwnProperty(name) || typeof object[name] !== type) {
    throw new Error(format(
      'Firebase.%s failed: %s argument must contain the key "%s" with type "%s"',
      method,
      position,
      name,
      type
    ));
  }
}

module.exports = FirebaseAuth;
