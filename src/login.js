'use strict';

var _   = require('lodash');
var md5 = require('MD5');

/*******************************************************************************
 * SIMPLE LOGIN
 * @deprecated
 ******************************************************************************/
function MockFirebaseSimpleLogin (ref, callback, userData) {
  // allows test units to monitor the callback function to make sure
  // it is invoked (even if one is not declared)
  this.callback = function () { callback.apply(null, Array.prototype.slice.call(arguments, 0)); };
  this.attempts = [];
  this.failMethod = MockFirebaseSimpleLogin.DEFAULT_FAIL_WHEN;
  this.ref = ref; // we don't use ref for anything
  this.autoFlushTime = MockFirebaseSimpleLogin.DEFAULT_AUTO_FLUSH;
  this.userData = _.cloneDeep(MockFirebaseSimpleLogin.DEFAULT_USER_DATA);
  if (userData) _.assign(this.userData, userData);
}

/*** PUBLIC METHODS AND FIXTURES ***/

MockFirebaseSimpleLogin.DEFAULT_FAIL_WHEN = function(provider, options, user) {
  var res = null;
  if( ['password', 'anonymous', 'twitter', 'facebook', 'google', 'github'].indexOf(provider) === -1 ) {
    console.error('MockFirebaseSimpleLogin:login() failed: unrecognized authentication provider '+provider);
//      res = createError();
  }
  else if( !user ) {
    res = createError('INVALID_USER', 'The specified user does not exist');
  }
  else if( provider === 'password' && user.password !== options.password ) {
    res = createError('INVALID_PASSWORD', 'The specified password is incorrect');
  }
  return res;
};

var USER_COUNT = 100;
MockFirebaseSimpleLogin.DEFAULT_USER_DATA = {};
_.each(['password', 'anonymous', 'facebook', 'twitter', 'google', 'github'], function(provider) {
  var user = createDefaultUser(provider);
  if( provider !== 'password' ) {
    MockFirebaseSimpleLogin.DEFAULT_USER_DATA[provider] = user;
  }
  else {
    var set = MockFirebaseSimpleLogin.DEFAULT_USER_DATA[provider] = {};
    set[user.email] = user;
  }
});

MockFirebaseSimpleLogin.DEFAULT_AUTO_FLUSH = false;

MockFirebaseSimpleLogin.prototype = {

  /*****************************************************
   * Test Unit Methods
   *****************************************************/

  /**
   * When this method is called, any outstanding login()
   * attempts will be immediately resolved. If this method
   * is called with an integer value, then the login attempt
   * will resolve asynchronously after that many milliseconds.
   *
   * @param {int|boolean} [milliseconds]
   * @returns {MockFirebaseSimpleLogin}
   */
  flush: function(milliseconds) {
    var self = this;
    if(_.isNumber(milliseconds) ) {
      setTimeout(_.bind(self.flush, self), milliseconds);
    }
    else {
      var attempts = self.attempts;
      self.attempts = [];
      _.each(attempts, function(x) {
        x[0].apply(self, x.slice(1));
      });
    }
    return self;
  },

  /**
   * Automatically queue the flush() event
   * each time login() is called. If this method
   * is called with `true`, then the callback
   * is invoked synchronously.
   *
   * If this method is called with an integer,
   * the callback is triggered asynchronously
   * after that many milliseconds.
   *
   * If this method is called with false, then
   * autoFlush() is disabled.
   *
   * @param {int|boolean} [milliseconds]
   * @returns {MockFirebaseSimpleLogin}
   */
  autoFlush: function(milliseconds) {
    this.autoFlushTime = milliseconds;
    if( this.autoFlushTime !== false ) {
      this.flush(this.autoFlushTime);
    }
    return this;
  },

  /**
   * `testMethod` is passed the {string}provider, {object}options, {object}user
   * for each call to login(). If it returns anything other than
   * null, then that is passed as the error message to the
   * callback and the login call fails.
   *
   * <code>
   *   // this is a simplified example of the default implementation (MockFirebaseSimpleLogin.DEFAULT_FAIL_WHEN)
   *   auth.failWhen(function(provider, options, user) {
   *      if( user.email !== options.email ) {
   *         return MockFirebaseSimpleLogin.createError('INVALID_USER');
   *      }
   *      else if( user.password !== options.password ) {
   *         return MockFirebaseSimpleLogin.createError('INVALID_PASSWORD');
   *      }
   *      else {
   *         return null;
   *      }
   *   });
   * </code>
   *
   * Multiple calls to this method replace the old failWhen criteria.
   *
   * @param testMethod
   * @returns {MockFirebaseSimpleLogin}
   */
  failWhen: function(testMethod) {
    this.failMethod = testMethod;
    return this;
  },

  /**
   * Retrieves a user account from the mock user data on this object
   *
   * @param provider
   * @param options
   */
  getUser: function(provider, options) {
    var data = this.userData[provider];
    if( provider === 'password' ) {
      data = (data||{})[options.email];
    }
    return data||null;
  },

  /*****************************************************
   * Public API
   *****************************************************/
  login: function(provider, options) {
    var err = this.failMethod(provider, options||{}, this.getUser(provider, options));
    this._notify(err, err===null? this.userData[provider]: null);
  },

  logout: function() {
    this._notify(null, null);
  },

  createUser: function(email, password, callback) {
    if (!callback) callback = _.noop;
    this._defer(function() {
      var user = null, err = null;
      if( this.userData.password.hasOwnProperty(email) ) {
        err = createError('EMAIL_TAKEN', 'The specified email address is already in use.');
      }
      else {
        user = createEmailUser(email, password);
        this.userData.password[email] = user;
      }
      callback(err, user);
    });
  },

  changePassword: function(email, oldPassword, newPassword, callback) {
    if (!callback) callback = _.noop;
    this._defer(function() {
      var user = this.getUser('password', {email: email});
      var err = this.failMethod('password', {email: email, password: oldPassword}, user);
      if( err ) {
        callback(err, false);
      }
      else {
        user.password = newPassword;
        callback(null, true);
      }
    });
  },

  sendPasswordResetEmail: function(email, callback) {
    if (!callback) callback = _.noop;
    this._defer(function() {
      var user = this.getUser('password', {email: email});
      if( !user ) {
        callback(createError('INVALID_USER'), false);
      }
      else {
        callback(null, true);
      }
    });
  },

  removeUser: function(email, password, callback) {
    if (!callback) callback = _.noop;
    this._defer(function() {
      var user = this.getUser('password', {email: email});
      if( !user ) {
        callback(createError('INVALID_USER'), false);
      }
      else if( user.password !== password ) {
        callback(createError('INVALID_PASSWORD'), false);
      }
      else {
        delete this.userData.password[email];
        callback(null, true);
      }
    });
  },

  /*****************************************************
   * Private/internal methods
   *****************************************************/
  _notify: function(error, user) {
    this._defer(this.callback, error, user);
  },

  _defer: function() {
    var args = _.toArray(arguments);
    this.attempts.push(args);
    if( this.autoFlushTime !== false ) {
      this.flush(this.autoFlushTime);
    }
  }
};

function createError(code, message) {
  return { code: code||'UNKNOWN_ERROR', message: 'FirebaseSimpleLogin: '+(message||code||'unspecific error') };
}

function createEmailUser (email, password) {
  var id = USER_COUNT++;
  return {
    uid: 'password:'+id,
    id: id,
    email: email,
    password: password,
    provider: 'password',
    md5_hash: md5(email),
    firebaseAuthToken: 'FIREBASE_AUTH_TOKEN' //todo
  };
}

function createDefaultUser (provider) {
  var id = USER_COUNT++;

  var out = {
    uid: provider+':'+id,
    id: id,
    password: id,
    provider: provider,
    firebaseAuthToken: 'FIREBASE_AUTH_TOKEN' //todo
  };
  switch(provider) {
    case 'password':
      out.email = 'email@firebase.com';
      out.md5_hash = md5(out.email);
      break;
    case 'twitter':
      out.accessToken = 'ACCESS_TOKEN'; //todo
      out.accessTokenSecret = 'ACCESS_TOKEN_SECRET'; //todo
      out.displayName = 'DISPLAY_NAME';
      out.thirdPartyUserData = {}; //todo
      out.username = 'USERNAME';
      break;
    case 'google':
      out.accessToken = 'ACCESS_TOKEN'; //todo
      out.displayName = 'DISPLAY_NAME';
      out.email = 'email@firebase.com';
      out.thirdPartyUserData = {}; //todo
      break;
    case 'github':
      out.accessToken = 'ACCESS_TOKEN'; //todo
      out.displayName = 'DISPLAY_NAME';
      out.thirdPartyUserData = {}; //todo
      out.username = 'USERNAME';
      break;
    case 'facebook':
      out.accessToken = 'ACCESS_TOKEN'; //todo
      out.displayName = 'DISPLAY_NAME';
      out.thirdPartyUserData = {}; //todo
      break;
    case 'anonymous':
      break;
    default:
      throw new Error('Invalid auth provider', provider);
  }

  return out;
}

module.exports = MockFirebaseSimpleLogin;
