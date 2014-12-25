'use strict';

var _ = require('lodash');

function FirebaseAuth () {
  this._auth = {
    userData: null,
    listeners: [],
    completionListeners: [],
    users: [],
    uidCounter: 1
  };

  this.changeAuthState = function (userData) {
    var self = this;
    this._defer(function() {
      if (!_.isEqual(self._auth.userData, userData)) {
        self._auth.userData = _.isObject(userData) ? userData : null;
        self._triggerAuthEvent();
      }
    });
  };

  this.getEmailUser = function (email) {
    var users = this._auth.users;
    return users.hasOwnProperty(email) ? _.clone(users[email]) : null;
  };

  this.auth = function (token, callback) {
    console.warn('FIREBASE WARNING: FirebaseRef.auth() being deprecated. Please use FirebaseRef.authWithCustomToken() instead.');
    this._authEvent('auth', callback);
  };

  this.authWithCustomToken = function (token, onComplete) {
    this._authEvent('authWithCustomToken', onComplete);
  };

  this.authAnonymously = function (onComplete) {
    this._authEvent('authAnonymously', onComplete);
  };

  this.authWithPassword = function (credentials, onComplete) {
    this._authEvent('authWithPassword', onComplete);
  };

  this.authWithOAuthPopup = function (provider, onComplete) {
    this._authEvent('authWithOAuthPopup', onComplete);
  };

  this.authWithOAuthRedirect = function (provider, onComplete) {
    this._authEvent('authWithOAuthRedirect', onComplete);
  };

  this.authWithOAuthToken = function (provider, credentials, onComplete) {
    this._authEvent('authWithOAuthToken', onComplete);
  };

  this._authEvent = function (method, callback) {
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

  this._triggerAuthEvent = function () {
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

  this.getAuth = function () {
    return this._auth.userData;
  };

  this.onAuth = function (onComplete, context) {
    this._auth.listeners.push({fn: onComplete, ctx: context});
  };

  this.offAuth = function (onComplete, context) {
    var index = _.findIndex(this._auth.listeners, function(v) {
      return v.fn === onComplete && v.ctx === context;
    });
    if (index > -1) {
      this._auth.listeners.splice(index, 1);
    }
  };

  this.unauth = function () {
    if (this._auth.userData !== null) {
      this._auth.userData = null;
      this._triggerAuthEvent();
    }
  };

  this.createUser = function (credentials, onComplete) {
    var err = this._nextErr('createUser');
    var users = this._auth.users;
    this._defer(_.bind(function() {
      var user = null;
      err = err ||
        this._validateCreds('createUser', credentials, ['email', 'password']) ||
        this._validateNewEmail(credentials);
      if( !err ) {
        var key = credentials.email;
        users[key] = {uid: this._nextUid(), email: key, password: credentials.password};
        user = {uid: users[key].uid};
      }
      onComplete(err, user);
    }, this));
  };

  this.changePassword = function (credentials, onComplete) {
    var err = this._nextErr('changePassword');
    this._defer(_.bind(function() {
      err = err ||
        this._validateCreds('changePassword', credentials, ['email', 'oldPassword', 'newPassword']) ||
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

  this.removeUser = function (credentials, onComplete) {
    var err = this._nextErr('removeUser');
    this._defer(_.bind(function() {
      err = err ||
        this._validateCreds('removeUser', credentials, ['email', 'password']) ||
        this._validateExistingEmail(credentials) ||
        this._validPass(credentials, 'password');
      if( !err ) {
        delete this._auth.users[credentials.email];
      }
      onComplete(err);
    }, this));
  };

  this.resetPassword = function (credentials, onComplete) {
    var err = this._nextErr('resetPassword');
    this._defer(_.bind(function() {
      err = err ||
        this._validateCreds('resetPassword', credentials, ['email']) ||
        this._validateExistingEmail(credentials);
      onComplete(err);
    }, this));
  };

  this._nextUid = function () {
    return 'simplelogin:'+(this._auth.uidCounter++);
  };

  this._validateNewEmail = function (creds) {
    creds = _.assign({}, creds);
    if( this._auth.users.hasOwnProperty(creds.email) ) {
      var err = new Error('The specified email address is already in use.');
      err.code = 'EMAIL_TAKEN';
      return err;
    }
    return null;
  };

  this._validateExistingEmail = function (creds) {
    creds = _.assign({}, creds);
    if( !this._auth.users.hasOwnProperty(creds.email) ) {
      var err = new Error('The specified user does not exist.');
      err.code = 'INVALID_USER';
      return err;
    }
    return null;
  };

  this._validateCreds = function (method, creds, fields) {
    var err = this._validObj(creds, method, 'First');
    var i = 0;
    while (err === null && i < fields.length) {
      err = this._validArg(method, creds, 'First', fields[i], 'string');
      i++;
    }
    return err;
  };

  this._validPass = function (obj, name) {
    var err = null;
    var key = obj.email;
    if( obj[name] !== this._auth.users[key].password ) {
      err = new Error('The specified password is incorrect.');
      err.code = 'INVALID_PASSWORD';
    }
    return err;
  };

  this._validObj = function (obj, method, position) {
    if( !_.isObject(obj) ) {
      return new Error('Firebase.' + method + ' failed: ' + position + ' argument must be a valid object.');
    }
    return null;
  };

  this._validArg = function (method, obj, position, name, type) {
    if( !obj.hasOwnProperty(name) || typeof(obj[name]) !== type ) {
      return new Error('Firebase.' + method + ' failed: ' + position +
        ' argument must contain the key "' + name + '" with type "' + type + '"');
    }
    return null;
  };
}

module.exports = FirebaseAuth;