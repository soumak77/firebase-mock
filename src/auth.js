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
  this._defer(function() {
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

FirebaseAuth.prototype.auth = function (token, callback) {
  console.warn('FIREBASE WARNING: FirebaseRef.auth() being deprecated. Please use FirebaseRef.authWithCustomToken() instead.');
  this._authEvent('auth', callback);
};

FirebaseAuth.prototype.authWithCustomToken = function (token, onComplete) {
  this._authEvent('authWithCustomToken', onComplete);
};

FirebaseAuth.prototype.authAnonymously = function (onComplete) {
  this._authEvent('authAnonymously', onComplete);
};

FirebaseAuth.prototype.authWithPassword = function (credentials, onComplete) {
  this._authEvent('authWithPassword', onComplete);
};

FirebaseAuth.prototype.authWithOAuthPopup = function (provider, onComplete) {
  this._authEvent('authWithOAuthPopup', onComplete);
};

FirebaseAuth.prototype.authWithOAuthRedirect = function (provider, onComplete) {
  this._authEvent('authWithOAuthRedirect', onComplete);
};

FirebaseAuth.prototype.authWithOAuthToken = function (provider, credentials, onComplete) {
  this._authEvent('authWithOAuthToken', onComplete);
};

FirebaseAuth.prototype._authEvent = function (method, callback) {
  var err = this._nextErr(method);
  if (!callback) return;
  if (err) {
    // if an error occurs, we defer the error report until the next flush()
    // event is triggered
    this._defer(function() {
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
  var list = this._auth.completionListeners;
  // clear the completion list before triggering callbacks
  this._auth.completionListeners = [];
  var user = this._auth.userData;
  // trigger completion listeners first
  _.forEach(list, function(parts) {
    parts.fn.call(parts.ctx, null, _.cloneDeep(user));
  });
  // then trigger onAuth listeners
  _.forEach(this._auth.listeners, function(parts) {
    parts.fn.call(parts.ctx, _.cloneDeep(user));
  });
};

FirebaseAuth.prototype.getAuth = function () {
  return this._auth.userData;
};

FirebaseAuth.prototype.onAuth = function (onComplete, context) {
  this._auth.listeners.push({fn: onComplete, ctx: context});
};

FirebaseAuth.prototype.offAuth = function (onComplete, context) {
  var index = _.findIndex(this._auth.listeners, function (listener) {
    return listener.fn === onComplete && listener.ctx === context;
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
  var err = this._nextErr('createUser');
  var users = this._auth.users;
  this._defer(_.bind(function() {
    var user = null;
    err = err ||
      validateCredentials('createUser', credentials, ['email', 'password']) ||
      this._validateNewEmail(credentials);
    if( !err ) {
      var key = credentials.email;
      users[key] = {uid: this._nextUid(), email: key, password: credentials.password};
      user = {uid: users[key].uid};
    }
    onComplete(err, user);
  }, this));
};

FirebaseAuth.prototype.changePassword = function (credentials, onComplete) {
  var err = this._nextErr('changePassword');
  this._defer(_.bind(function() {
    err = err ||
      validateCredentials('changePassword', credentials, ['email', 'oldPassword', 'newPassword']) ||
      this._validateExistingEmail(credentials) ||
      this._validPass(credentials, 'oldPassword');
    if( !err ) {
      var key = credentials.email;
      var user = this._auth.users[key];
      user.password = credentials.newPassword;
    }
    onComplete(err);
  }, this));
};

FirebaseAuth.prototype.removeUser = function (credentials, onComplete) {
  var err = this._nextErr('removeUser');
  this._defer(_.bind(function() {
    err = err ||
      validateCredentials('removeUser', credentials, ['email', 'password']) ||
      this._validateExistingEmail(credentials) ||
      this._validPass(credentials, 'password');
    if( !err ) {
      delete this._auth.users[credentials.email];
    }
    onComplete(err);
  }, this));
};

FirebaseAuth.prototype.resetPassword = function (credentials, onComplete) {
  var err = this._nextErr('resetPassword');
  this._defer(_.bind(function() {
    err = err ||
      validateCredentials('resetPassword', credentials, ['email']) ||
      this._validateExistingEmail(credentials);
    onComplete(err);
  }, this));
};

FirebaseAuth.prototype._nextUid = function () {
  return 'simplelogin:'+(this._auth.uidCounter++);
};

FirebaseAuth.prototype._validateNewEmail = function (creds) {
  creds = _.assign({}, creds);
  if( this._auth.users.hasOwnProperty(creds.email) ) {
    var err = new Error('The specified email address is already in use.');
    err.code = 'EMAIL_TAKEN';
    return err;
  }
  return null;
};

FirebaseAuth.prototype._validateExistingEmail = function (creds) {
  creds = _.assign({}, creds);
  if( !this._auth.users.hasOwnProperty(creds.email) ) {
    var err = new Error('The specified user does not exist.');
    err.code = 'INVALID_USER';
    return err;
  }
  return null;
};

FirebaseAuth.prototype._validPass = function (obj, name) {
  var err = null;
  var key = obj.email;
  if( obj[name] !== this._auth.users[key].password ) {
    err = new Error('The specified password is incorrect.');
    err.code = 'INVALID_PASSWORD';
  }
  return err;
};

function validateCredentials (method, credentials, fields) {
  var err = validateObject(credentials, method, 'First');
  var i = 0;
  while (err === null && i < fields.length) {
    err = validateArgument(method, credentials, 'First', fields[i], 'string');
    i++;
  }
  return err;
}

function validateObject (object, method, position) {
  if (!_.isObject(object)) {
    return new Error(format(
      'Firebase.%s failed: %s argument must be a valid object.',
      method,
      position
    ));
  }
  return null;
}

function validateArgument (method, object, position, name, type) {
  if (!object.hasOwnProperty(name) || typeof object[name] !== type) {
    return new Error(format(
      'Firebase.%s failed: %s argument must contain the key "%s" with type "%s"',
      method,
      position,
      name,
      type
    ));
  }
  return null;
}

module.exports = FirebaseAuth;