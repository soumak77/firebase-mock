'use strict';

var _      = require('lodash');
var format = require('util').format;

function FirebaseAuth () {
  this._auth = {
    userData: null,
    listeners: [],
    completionListeners: [],
    users: [],
    uidCounter: 1
  };
}

FirebaseAuth.prototype.changeAuthState = function (userData) {
  this._defer('changeAuthState', _.toArray(arguments), function() {
    if (!_.isEqual(this._auth.userData, userData)) {
      this._auth.userData = _.isObject(userData) ? userData : null;
      this._triggerAuthEvent();
    }
  });
};

FirebaseAuth.prototype.getEmailUser = function (email) {
  var users = this._auth.users;
  return users.hasOwnProperty(email) ? _.clone(users[email]) : null;
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

FirebaseAuth.prototype.auth = function (token, callback) {
  console.warn('FIREBASE WARNING: FirebaseRef.auth() being deprecated. Please use FirebaseRef.authWithCustomToken() instead.');
  this._authEvent('auth', callback);
};

FirebaseAuth.prototype._authEvent = function (method, callback) {
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
    // if there is no error, then we just add our callback to the listener
    // stack and wait for the next changeAuthState() call.
    this._auth.completionListeners.push({fn: callback});
  }
};

FirebaseAuth.prototype._triggerAuthEvent = function () {
  var completionListeners = this._auth.completionListeners;
  this._auth.completionListeners = [];
  var user = this._auth.userData;
  completionListeners.forEach(function (parts) {
    parts.fn.call(parts.context, null, _.cloneDeep(user));
  });
  this._auth.listeners.forEach(function (parts) {
    parts.fn.call(parts.context, _.cloneDeep(user));
  });
};

FirebaseAuth.prototype.getAuth = function () {
  return this._auth.userData;
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
  if (this._auth.userData !== null) {
    this._auth.userData = null;
    this._triggerAuthEvent();
  }
};

FirebaseAuth.prototype.createUser = function (credentials, onComplete) {
  validateCredentials('createUser', credentials, [
    'email',
    'password'
  ]);
  var err = this._nextErr('createUser');
  var users = this._auth.users;
  this._defer('createUser', _.toArray(arguments), function () {
    var user = null;
    err = err || this._validateNewEmail(credentials);
    if (!err) {
      var key = credentials.email;
      users[key] = {
        uid: this._nextUid(),
        email: key,
        password: credentials.password
      };
      user = {
        uid: users[key].uid
      };
    }
    onComplete(err, user);
  });
};

FirebaseAuth.prototype.changeEmail = function (credentials, onComplete) {
  validateCredentials('changeEmail', credentials, [
    'oldEmail',
    'newEmail',
    'password'
  ]);
  var err = this._nextErr('changeEmail');
  this._defer('changeEmail', _.toArray(arguments), function () {
    err = err ||
      this._validateExistingEmail({
        email: credentials.oldEmail
      }) ||
      this._validPass({
        password: credentials.password,
        email: credentials.oldEmail
      }, 'password');
    if (!err) {
      var users = this._auth.users;
      var user = users[credentials.oldEmail];
      delete users[credentials.oldEmail];
      user.email = credentials.newEmail;
      users[user.email] = user;
    }
    onComplete(err);
  });
};

FirebaseAuth.prototype.changePassword = function (credentials, onComplete) {
  validateCredentials('changePassword', credentials, [
    'email',
    'oldPassword',
    'newPassword'
  ]);
  var err = this._nextErr('changePassword');
  this._defer('changePassword', _.toArray(arguments), function () {
    err = err ||
      this._validateExistingEmail(credentials) ||
      this._validPass(credentials, 'oldPassword');
    if (!err) {
      var key = credentials.email;
      var user = this._auth.users[key];
      user.password = credentials.newPassword;
    }
    onComplete(err);
  });
};

FirebaseAuth.prototype.removeUser = function (credentials, onComplete) {
  validateCredentials('removeUser', credentials, [
    'email',
    'password'
  ]);
  var err = this._nextErr('removeUser');
  this._defer('removeUser', _.toArray(arguments), function () {
    err = err ||
      this._validateExistingEmail(credentials) ||
      this._validPass(credentials, 'password');
    if (!err) {
      delete this._auth.users[credentials.email];
    }
    onComplete(err);
  });
};

FirebaseAuth.prototype.resetPassword = function (credentials, onComplete) {
  validateCredentials('resetPassword', credentials, [
    'email'
  ]);
  var err = this._nextErr('resetPassword');
  this._defer('resetPassword', _.toArray(arguments), function() {
    err = err ||
      this._validateExistingEmail(credentials);
    onComplete(err);
  });
};

FirebaseAuth.prototype._nextUid = function () {
  return 'simplelogin:' + (this._auth.uidCounter++);
};

FirebaseAuth.prototype._validateNewEmail = function (credentials) {
  if (this._auth.users.hasOwnProperty(credentials.email)) {
    var err = new Error('The specified email address is already in use.');
    err.code = 'EMAIL_TAKEN';
    return err;
  }
  return null;
};

FirebaseAuth.prototype._validateExistingEmail = function (credentials) {
  if (!this._auth.users.hasOwnProperty(credentials.email)) {
    var err = new Error('The specified user does not exist.');
    err.code = 'INVALID_USER';
    return err;
  }
  return null;
};

FirebaseAuth.prototype._validPass = function (object, name) {
  var err = null;
  var key = object.email;
  if (object[name] !== this._auth.users[key].password) {
    err = new Error('The specified password is incorrect.');
    err.code = 'INVALID_PASSWORD';
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
