/**
 * MockFirebase: A Firebase stub/spy library for writing unit tests
 * https://github.com/katowulf/mockfirebase
 * @version 0.0.3
 */
(function(exports) {
  var DEBUG = false;
  var PUSH_COUNTER = 0;
  var _ = requireLib('lodash', '_');
  var sinon = requireLib('sinon');
  var _Firebase = exports.Firebase;
  var _FirebaseSimpleLogin = exports.FirebaseSimpleLogin;

  /**
   * A mock that simulates Firebase operations for use in unit tests.
   *
   * ## Setup
   *
   *     // in windows
   *     <script src="lib/lodash.js"></script> <!-- dependency -->
   *     <script src="lib/MockFirebase.js"></script> <!-- the lib -->
   *     <!-- not working yet: MockFirebase.stub(window, 'Firebase'); // replace window.Firebase -->
   *
   *     // in node.js
   *     var Firebase = require('../lib/MockFirebase');
   *
   * ## Usage Examples
   *
   *     var fb = new Firebase('Mock://foo/bar');
   *     fb.on('value', function(snap) {
    *        console.log(snap.val());
    *     });
   *
   *     // do something async or synchronously...
   *
   *     // trigger callbacks and event listeners
   *     fb.flush();
   *
   *     // spy on methods
   *     expect(fb.on.called).toBe(true);
   *
   * ## Trigger events automagically instead of calling flush()
   *
   *     var fb = new MockFirebase('Mock://hello/world');
   *     fb.autoFlush(1000); // triggers events after 1 second (asynchronous)
   *     fb.autoFlush(); // triggers events immediately (synchronous)
   *
   * ## Simulating Errors
   *
   *     var fb = new MockFirebase('Mock://fails/a/lot');
   *     fb.failNext('set', new Error('PERMISSION_DENIED'); // create an error to be invoked on the next set() op
   *     fb.set({foo: bar}, function(err) {
    *         // err.message === 'PERMISSION_DENIED'
    *     });
   *     fb.flush();
   *
   * @param {string} [currentPath] use a relative path here or a url, all .child() calls will append to this
   * @param {Object} [data] specify the data in this Firebase instance (defaults to MockFirebase.DEFAULT_DATA)
   * @param {MockFirebase} [parent] for internal use
   * @param {string} [name] for internal use
   * @constructor
   */
  function MockFirebase(currentPath, data, parent, name) {
    // these are set whenever startAt(), limit() or endAt() get invoked
    this._queryProps = { limit: undefined, startAt: undefined, endAt: undefined };

    // represents the fake url
    this.currentPath = currentPath || 'Mock://';

    // do not modify this directly, use set() and flush(true)
    this.data = _.cloneDeep(arguments.length > 1? data||null : MockFirebase.DEFAULT_DATA);

    // see failNext()
    this.errs = {};

    // used for setPriorty and moving records
    this.priority = null;

    // null for the root path
    this.myName = parent? name : extractName(currentPath);

    // see autoFlush()
    this.flushDelay = false;

    // stores the listeners for various event types
    this._events = { value: [], child_added: [], child_removed: [], child_changed: [], child_moved: [] };

    // allows changes to be propagated between child/parent instances
    this.parent = parent||null;
    this.children = [];
    parent && parent.children.push(this);

    // stores the operations that have been queued until a flush() event is triggered
    this.ops = [];

    // turn all our public methods into spies so they can be monitored for calls and return values
    // see jasmine spies: https://github.com/pivotal/jasmine/wiki/Spies
    // the Firebase constructor can be spied on using spyOn(window, 'Firebase') from within the test unit
    for(var key in this) {
      if( !key.match(/^_/) && typeof(this[key]) === 'function' ) {
        sinon.spy(this, key);
      }
    }
  }

  MockFirebase.prototype = {
    /*****************************************************
     * Test Unit tools (not part of Firebase API)
     *****************************************************/

    /**
     * Invoke all the operations that have been queued thus far. If a numeric delay is specified, this
     * occurs asynchronously. Otherwise, it is a synchronous event.
     *
     * This allows Firebase to be used in synchronous tests without waiting for async callbacks. It also
     * provides a rudimentary mechanism for simulating locally cached data (events are triggered
     * synchronously when you do on('value') or on('child_added') against locally cached data)
     *
     * If you call this multiple times with different delay values, you could invoke the events out
     * of order; make sure that is your intention.
     *
     * @param {boolean|int} [delay]
     * @returns {MockFirebase}
     */
    flush: function(delay) {
      var self = this, list = self.ops;
      self.ops = [];
      if( _.isNumber(delay) ) {
        setTimeout(process, delay);
      }
      else {
        process();
      }
      function process() {
        list.forEach(function(parts) {
          parts[0].apply(self, parts.slice(1));
        });

        self.children.forEach(function(c) {
          c.flush();
        });
      }
      return self;
    },

    /**
     * Automatically trigger a flush event after each operation. If a numeric delay is specified, this is an
     * asynchronous event. If value is set to true, it is synchronous (flush is triggered immediately). Setting
     * this to false disables autoFlush
     *
     * @param {int|boolean} [delay]
     */
    autoFlush: function(delay){
      this.flushDelay = _.isUndefined(delay)? true : delay;
      this.children.forEach(function(c) {
        c.autoFlush(delay);
      });
      delay !== false && this.flush(delay);
      return this;
    },

    /**
     * Simulate a failure by specifying that the next invocation of methodName should
     * fail with the provided error.
     *
     * @param {String} methodName currently only supports `set` and `transaction`
     * @param {String|Error} error
     */
    failNext: function(methodName, error) {
      this.errs[methodName] = error;
    },

    /**
     * Returns a copy of the current data
     * @returns {*}
     */
    getData: function() {
      return _.cloneDeep(this.data);
    },

    /**
     * Returns the last automatically generated ID
     * @returns {string|string|*}
     */
    getLastAutoId: function() {
      return 'mock'+PUSH_COUNTER;
    },

    /*****************************************************
     * Firebase API methods
     *****************************************************/

    toString: function() {
      return this.currentPath;
    },

    child: function(childPath) {
      if( !childPath ) { throw new Error('bad child path '+this.toString()); }
      var parts = _.isArray(childPath)? childPath : childPath.split('/');
      var childKey = parts.shift();
      var child = _.find(this.children, function(c) {
        return c.name() === childKey;
      });
      if( !child ) {
        child = new MockFirebase(mergePaths(this.currentPath, childKey), this._childData(childKey), this, childKey);
        child.flushDelay = this.flushDelay;
      }
      if( parts.length ) {
        child = child.child(parts);
      }
      return child;
    },

    set: function(data, callback) {
      var self = this;
      var err = this._nextErr('set');
      data = _.cloneDeep(data);
      DEBUG && console.log('set called',this.toString(), data); //debug
      this._defer(function() {
        DEBUG && console.log('set completed',this.toString(), data); //debug
        if( err === null ) {
          self._dataChanged(data);
        }
        callback && callback(err);
      });
      return this;
    },

    update: function(changes, callback) {
      if( !_.isObject(changes) ) {
        throw new Error('First argument must be an object when calling $update');
      }
      var self = this;
      var err = this._nextErr('update');
      var base = this.getData();
      var data = _.assign(_.isObject(base)? base : {}, changes);
      DEBUG && console.log('update called', this.toString(), data); //debug
      this._defer(function() {
        DEBUG && console.log('update completed', this.toString(), data); //debug
        if( err === null ) {
          self._dataChanged(data);
        }
        callback && callback(err);
      });
    },

    setPriority: function(newPriority) {
      this._priChanged(newPriority);
    },

    name: function() {
      return this.myName;
    },

    ref: function() {
      return this;
    },

    parent: function() {
      return this.parent? this.parent : this;
    },

    root: function() {
      var next = this;
      while(next.parent()) {
        next = next.parent();
      }
      return next;
    },

    push: function(data) {
      var id = 'mock'+(++PUSH_COUNTER);
      var child = this.child(id);
      if( data ) {
        child.set(data);
      }
      return child;
    },

    once: function(event, callback) {
      function fn(snap) {
        this.off(event, fn);
        callback(snap);
      }
      this.on(event, fn);
    },

    remove: function() {
      this._dataChanged(null);
    },

    on: function(event, callback) { //todo cancelCallback?
      this._events[event].push(callback);
      var data = this.getData(), self = this, pri = this.priority;
      if( event === 'value' ) {
        this._defer(function() {
          callback(makeSnap(self, data, pri));
        });
      }
      else if( event === 'child_added' ) {
        this._defer(function() {
          var prev = null;
          _.each(data, function(v, k) {
            callback(makeSnap(self.child(k), v, pri), prev);
            prev = k;
          });
        });
      }
    },

    off: function(event, callback) {
      if( !event ) {
        for (var key in this._events)
          if( this._events.hasOwnProperty(key) )
            this.off(key);
      }
      else if( callback ) {
        this._events[event] = _.without(this._events[event], callback);
      }
      else {
        this._events[event] = [];
      }
    },

    transaction: function(valueFn, finishedFn, applyLocally) {
      var valueSpy = sinon.spy(valueFn);
      var finishedSpy = sinon.spy(finishedFn);
      this._defer(function() {
        var err = this._nextErr('transaction');
        // unlike most defer methods, this will use the value as it exists at the time
        // the transaction is actually invoked, which is the eventual consistent value
        // it would have in reality
        var res = valueSpy(this.getData());
        var newData = _.isUndefined(res) || err? this.getData() : res;
        finishedSpy(err, err === null && !_.isUndefined(res), makeSnap(this, newData, this.priority));
        this._dataChanged(newData);
      });
      return [valueSpy, finishedSpy, applyLocally];
    },

    /**
     * If token is valid and parses, returns the contents of token as exected. If not, the error is returned.
     * Does not change behavior in any way (since we don't really auth anywhere)
     *
     * @param {String} token
     * @param {Function} [callback]
     */
    auth: function(token, callback) {
      //todo invoke callback with the parsed token contents
      callback && this._defer(callback);
    },

    /**
     * Just a stub at this point.
     * @param {int} limit
     */
    limit: function(limit) {
      this._queryProps.limit = limit;
      //todo
    },

    startAt: function(priority, recordId) {
      this._queryProps.startAt = [priority, recordId];
      //todo
    },

    endAt: function(priority, recordId) {
      this._queryProps.endAt = [priority, recordId];
      //todo
    },

    /*****************************************************
     * Private/internal methods
     *****************************************************/

    _childChanged: function(ref) {
      var data = ref.getData(), pri = ref.priority;
      if( !_.isObject(this.data) && data !== null ) { this.data = {}; }
      var exists = this.data.hasOwnProperty(ref.name());
      DEBUG && console.log('_childChanged', this.toString() + ' -> ' + ref.name(), data); //debug
      if( data === null && exists ) {
        delete this.data[ref.name()];
        this._trigger('child_removed', data, pri, ref.name());
        this._trigger('value', this.data, this.priority);
      }
      else if( data !== null ) {
        this.data[ref.name()] = _.cloneDeep(data);
        this._trigger(exists? 'child_changed' : 'child_added', data, pri, ref.name());
        this._trigger('value', this.data, this.priority);
        this.parent && this.parent._childChanged(this);
      }
    },

    _dataChanged: function(data) {
      var self = this;
      if(_.isObject(data) && _.has(data, '.priority')) {
        this._priChanged(data['.priority']);
        delete data['.priority'];
      }
      if( !_.isEqual(data, this.data) ) {
        this.data = _.cloneDeep(data);
        DEBUG && console.log('_dataChanged', this.toString(), data); //debug
        this._trigger('value', this.data, this.priority);
        if(this.children.length) {
          this._resort();
          _.each(this.children, function(child) {
            child._dataChanged(self._childData(child.name()));
          });
        }
        if( this.parent && _.isObject(this.parent.data) ) {
          this.parent._childChanged(this);
        }
      }
    },

    _priChanged: function(newPriority) {
      DEBUG && console.log('_priChanged', this.toString(), newPriority); //debug
      this.priority = newPriority;
      if( this.parent ) {
        this.parent._resort(this.name());
      }
    },

    _resort: function(childKeyMoved) {
      this.children.sort(childComparator);
      if( !_.isUndefined(childKeyMoved) ) {
        var child = this.child(childKeyMoved);
        this._trigger('child_moved', child.getData(), child.priority, childKeyMoved);
      }
    },

    _defer: function(fn) {
      //todo should probably be taking some sort of snapshot of my data here and passing
      //todo that into `fn` for reference
      this.ops.push(Array.prototype.slice.call(arguments, 0));
      if( this.flushDelay !== false ) { this.flush(this.flushDelay); }
    },

    _trigger: function(event, data, pri, key) {
      var self = this, ref = event==='value'? self : self.child(key);
      var snap = makeSnap(ref, data, pri);
      _.each(self._events[event], function(fn) {
        if(_.contains(['child_added', 'child_moved'], event)) {
          fn(snap, self._getPrevChild(key, pri));
        }
        else {
          //todo allow scope by changing fn to an array? for use with on() and once() which accept scope?
          fn(snap);
        }
      });
    },

    _nextErr: function(type) {
      var err = this.errs[type];
      delete this.errs[type];
      return err||null;
    },

    _childData: function(key) {
      return _.isObject(this.data) && _.has(this.data, key)? this.data[key] : null;
    },

    _getPrevChild: function(key, pri) {
      function keysMatch(c) { return c.name() === key }
      var recs = this.children;
      var i = _.findIndex(recs, keysMatch);
      if( i === -1 ) {
        recs = this.children.slice();
        child = {name: function() { return key; }, priority: pri===undefined? null : pri };
        recs.push(child);
        recs.sort(childComparator);
        i = _.findIndex(recs, keysMatch);
      }
      return i > 0? i : null;
    }
  };


  /*******************************************************************************
   * SIMPLE LOGIN
   ******************************************************************************/
  function MockFirebaseSimpleLogin(ref, callback, resultData) {
    // allows test units to monitor the callback function to make sure
    // it is invoked (even if one is not declared)
    this.callback = sinon.spy(callback||function() {});
    this.attempts = [];
    this.failMethod = MockFirebaseSimpleLogin.DEFAULT_FAIL_WHEN;
    this.ref = ref; // we don't use ref for anything
    this.autoFlushTime = MockFirebaseSimpleLogin.DEFAULT_AUTO_FLUSH;
    this.resultData = _.cloneDeep(MockFirebaseSimpleLogin.DEFAULT_RESULT_DATA);
    resultData && _.assign(this.resultData, resultData);
  }

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
        setTimeout(self.flush.bind(self), milliseconds);
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
      var data = this.resultData[provider];
      if( provider === 'password' ) {
        data = (data||{})[options.email];
      }
      return data||{};
    },

    /*****************************************************
     * Public API
     *****************************************************/
    login: function(provider, options) {
      var err = this.failMethod(provider, options||{}, this.getUser(provider, options));
      this._notify(err, err===null? this.resultData[provider]: null);
    },

    logout: function() {
      this._notify(null, null);
    },

    createUser: function(email, password, callback) {
      callback || (callback = _.noop);
      this._defer(function() {
        var user = this.resultData['password'][email] = createEmailUser(email, password);
        this.callback(null, user);
      });
    },

    changePassword: function(email, oldPassword, newPassword, callback) {
      callback || (callback = _.noop);
      this._defer(function() {
        var user = this.getUser('password', {email: email});
        if( !user ) {
          callback(MockFirebaseSimpleLogin.createError('INVALID_USER'), false);
        }
        else if( oldPassword !== user.password ) {
          callback(MockFirebaseSimpleLogin.createError('INVALID_PASSWORD'), false);
        }
        else {
          user.password = newPassword;
          callback(null, true);
        }
      });
    },

    sendPasswordResetEmail: function(email, callback) {
      callback || (callback = _.noop);
      this._defer(function() {
        var user = this.getUser('password', {email: email});
        if( user ) {
          callback(null, true);
        }
        else {
          callback(MockFirebaseSimpleLogin.createError('INVALID_USER'), false);
        }
      });
    },

    removeUser: function(email, password, callback) {
      callback || (callback = _.noop);
      this._defer(function() {
        var user = this.getUser('password', {email: email});
        if( !user ) {
          callback(MockFirebaseSimpleLogin.createError('INVALID_USER'), false);
        }
        else if( user.password !== password ) {
          callback(MockFirebaseSimpleLogin.createError('INVALID_PASSWORD'), false);
        }
        else {
          delete this.resultData['password'][email];
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

  /*** UTIL FUNCTIONS ***/
  var USER_COUNT = 100;
  function createEmailUser(email, password) {
    var id = USER_COUNT++;
    return {
      uid: 'password:'+id,
      id: id,
      email: email,
      password: password,
      provider: 'password',
      md5_hash: MD5(email),
      firebaseAuthToken: 'FIREBASE_AUTH_TOKEN' //todo
    };
  }

  function createDefaultUser(provider, i) {
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
        out.md5_hash = MD5(out.email);
        break;
      case 'persona':
        out.email = 'email@firebase.com';
        out.md5_hash = MD5(out.email);
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

  function ref(path, autoSyncDelay) {
    var ref = new MockFirebase();
    ref.flushDelay = _.isUndefined(autoSyncDelay)? true : autoSyncDelay;
    if( path ) { ref = ref.child(path); }
    return ref;
  }

  function mergePaths(base, add) {
    return base.replace(/\/$/, '')+'/'+add.replace(/^\//, '');
  }

  function makeSnap(ref, data, pri) {
    data = _.cloneDeep(data);
    return {
      val: function() { return data; },
      ref: function() { return ref; },
      name: function() { return ref.name() },
      getPriority: function() { return pri; }, //todo
      forEach: function(cb, scope) {
        _.each(data, function(v, k, list) {
          var child = ref.child(k);
          //todo the priority here is inaccurate if child pri modified
          //todo between calling makeSnap and forEach() on that snap
          var res = cb.call(scope, makeSnap(child, v, child.priority));
          return !(res === true);
        });
      }
    }
  }

  function extractName(path) {
    return ((path || '').match(/\/([^.$\[\]#\/]+)$/)||[null, null])[1];
  }

  function childComparator(a, b) {
    if(a.priority === b.priority) {
      var key1 = a.name(), key2 = b.name();
      return ( ( key1 == key2 ) ? 0 : ( ( key1 > key2 ) ? 1 : -1 ) );
    }
    else {
      return a.priority < b.priority? -1 : 1;
    }
  }

  // a polyfill for window.atob to allow JWT token parsing
  // credits: https://github.com/davidchambers/Base64.js
  ;(function (object) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    function InvalidCharacterError(message) {
      this.message = message;
    }
    InvalidCharacterError.prototype = new Error;
    InvalidCharacterError.prototype.name = 'InvalidCharacterError';

    // encoder
    // [https://gist.github.com/999166] by [https://github.com/nignag]
    object.btoa || (
      object.btoa = function (input) {
        for (
          // initialize result and counter
          var block, charCode, idx = 0, map = chars, output = '';
          // if the next input index does not exist:
          //   change the mapping table to "="
          //   check if d has no fractional digits
          input.charAt(idx | 0) || (map = '=', idx % 1);
          // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
          output += map.charAt(63 & block >> 8 - idx % 1 * 8)
          ) {
          charCode = input.charCodeAt(idx += 3/4);
          if (charCode > 0xFF) {
            throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
          }
          block = block << 8 | charCode;
        }
        return output;
      });

    // decoder
    // [https://gist.github.com/1020396] by [https://github.com/atk]
    object.atob || (
      object.atob = function (input) {
        input = input.replace(/=+$/, '')
        if (input.length % 4 == 1) {
          throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
        }
        for (
          // initialize result and counters
          var bc = 0, bs, buffer, idx = 0, output = '';
          // get next character
          buffer = input.charAt(idx++);
          // character found in table? initialize bit storage and add its ascii value;
          ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
            // and if not first of each 4 characters,
            // convert the first 8 bits to one ascii character
            bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
          ) {
          // try to find character in table (0-63, not found => -1)
          buffer = chars.indexOf(buffer);
        }
        return output;
      });

  }(exports));

  // MD5 (Message-Digest Algorithm) by WebToolkit
  //

  var MD5=function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]|(G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};

  function requireLib(moduleName, variableName) {
    if( typeof module !== "undefined" && module.exports && typeof(require) === 'function' ) {
      return require(moduleName);
    }
    else {
      return exports[variableName||moduleName];
    }
  }

  /*** PUBLIC METHODS AND FIXTURES ***/

  MockFirebaseSimpleLogin.createError = function(code, message) {
    return { code: code||'UNKNOWN_ERROR', message: message||code||'UNKNOWN_ERROR' };
  }

  MockFirebaseSimpleLogin.DEFAULT_FAIL_WHEN = function(provider, options, user) {
    var res = null;
    if( ['persona', 'anonymous', 'password', 'twitter', 'facebook', 'google', 'github'].indexOf(provider) === -1 ) {
      console.error('MockFirebaseSimpleLogin:login() failed: unrecognized authentication provider '+provider);
//      res = MockFirebaseSimpleLogin.createError();
    }
    else if( provider === 'password' ) {
      if( user.email !== options.email ) {
        res = MockFirebaseSimpleLogin.createError('INVALID_USER');
      }
      else if( user.password !== options.password ) {
        res = MockFirebaseSimpleLogin.createError('INVALID_PASSWORD');
      }
    }
    return res;
  };

  MockFirebaseSimpleLogin.DEFAULT_RESULT_DATA = {};
  //todo make this accurate to the provider's data
  _.each(['persona', 'anonymous', 'password', 'facebook', 'twitter', 'google', 'github'], function(provider) {
    var user = createDefaultUser(provider);
    if( provider !== 'password' ) {
      MockFirebaseSimpleLogin.DEFAULT_RESULT_DATA[provider] = user;
    }
    else {
      var set = MockFirebaseSimpleLogin.DEFAULT_RESULT_DATA[provider] = {};
      set[user.email] = user;
    }
  });


  MockFirebase.MD5 = MD5;
  MockFirebaseSimpleLogin.DEFAULT_AUTO_FLUSH = false;

  MockFirebase._ = _; // expose for tests

  MockFirebase.noConflict = function() {
    exports.Firebase = _Firebase;
    exports.FirebaseSimpleLogin = _FirebaseSimpleLogin;
  };

  MockFirebase.ref = ref;
  MockFirebase.DEFAULT_DATA  = {
    'data': {
      'a': {
        hello: 'world',
        aNumber: 1,
        aBoolean: false
      },
      'b': {
        foo: 'bar',
        aNumber: 2,
        aBoolean: true
      },
      'c': {
        bar: 'baz',
        aNumber: 3,
        aBoolean: true
      }
    }
  };

  // some hoop jumping for node require() vs browser usage
  exports.MockFirebase = MockFirebase;
  exports.MockFirebaseSimpleLogin = MockFirebaseSimpleLogin;
  exports.Firebase = MockFirebase;
  exports.FirebaseSimpleLogin = MockFirebaseSimpleLogin;

})(typeof(module)==='object' && module.exports? module.exports : this);