MockFirebase [![Build Status](https://travis-ci.org/katowulf/mockfirebase.svg?branch=master)](https://travis-ci.org/katowulf/mockfirebase)
============

**This is an experimental library and is not supported by Firebase**

## Setup

### Node/Browserify

```bash
$ npm install mockfirebase
```

```js
var MockFirebase = require('mockfirebase').MockFirebase;
```

### AMD / Browser

```bash
$ bower install mockfirebase
```

```html
<!-- include sinon unless you use jasmine -->
<script src="./bower_components/mockfirebase/browser/mockfirebase.js"></script>
```

### Browser Support

Works by default with IE 9 and up. To add support for older versions, just include polyfills for [Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Compatibility),
[Array.prototype.indexOf](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf#Polyfill), and [Array.prototype.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Polyfill).

## API

MockFirebase supports the normal [Firebase API](https://www.firebase.com/docs/web/api/) plus a small set of utility methods documented fully in the [API Reference](API.md). Rather than make a server call that is actually asynchronous, MockFirebase allow you to either trigger callbacks synchronously or asynchronously with a specified delay ([`ref.flush`](API.md#flushdelay---ref)).

```js
var ref = new MockFirebase('Mock://firebase');
var gotValue = false;
fb.on('value', function (snapshot) {
  gotValue = true;
});
fb.set({
  foo: 'bar'
});
assert(gotValue === false);
fb.flush();
assert(gotValue === true);
```

## API

All the regular Firebase methods are(?) supported. In addition, the following test-related methods exist:

### flush

    @param {boolean|int} [delay] in milliseconds
    @returns {MockFirebase}

Invoke all the operations that have been queued thus far. If a numeric delay is passed, this
occurs asynchronously. Otherwise, it is a synchronous event (at the time `flush` is called).

This allows Firebase to be used in synchronous tests without waiting for async callbacks. It also
provides a rudimentary mechanism for simulating locally cached data (events are triggered
synchronously when you do `on('value')` or `on('child_added')`)

If you call this multiple times with different delay values, you can invoke the events out
of order, as might happen on a network with some latency, or if multiple users update values in rapid succession.

### autoFlush

    @param {int|boolean} [delay] in milliseconds

Automatically trigger a `flush` after each operation. If a numeric delay is passed, the flush is performed asychronously after the delay. If `true` is passed, `flush` is triggered synchronously, immediately after data is changed or handlers are added. Passing `false` disables `autoFlush`

### failNext

    @param {String} methodName currently only supports `set`, `update`, `push` (with data) and `transaction`
    @param {String|Error} error

Simulate a failure by specifying that the next invocation of methodName should fail with the provided error.

## getData

@returns {*}

Returns a copy of the current data

## changeAuthState

Manually set user data with the parameters specified in the Firebase [`auth`](https://www.firebase.com/docs/web/api/firebase/onauth.html) docs

## getEmailUser

Get a user that was created with [createUser](https://www.firebase.com/docs/web/api/firebase/createuser.html)

# Proxying Firebase

When writing unit tests, you'll probably want to patch calls to `Firebase` in your source code with `MockFirebase`.

## Browser

If `Firebase` is attached to the `window`, you can just replace it using the override method:

```js
MockFirebase.override();
```

Make sure to include `MockFirebase` before overwriting Firebase and then add your tests after the patch.

## Node/Browserify
In Node/Browserify, you need to patch `require` itself. [proxyquire](https://github.com/thlorenz/proxyquire) and [proxyquireify](https://github.com/thlorenz/proxyquireify) make this easy.

```js
// ./mySrc.js
var Firebase = require('firebase');
var ref = new Firebase('myRefUrl');
ref.on('value', function (snapshot) {
  console.log(snapshot.val());
});
```

In order to test the above source code, we can use proxyquire.

**Example**

```js
// ./test.js
var proxyquire   = require('proxyquire');
var MockFirebase = require('mockfirebase').MockFirebase;
var mock;
var mySrc = proxyquire('./mySrc', {
  firebase: function (url) {
    return (mock = new MockFirebase(url));
  };
});
mock.flush();
// data is logged
```

Note that the key in the stubs object matches the module name (`'firebase'`) and not the capitalized variable name.

# Support

Use the [issues list](https://github.com/katowulf/mockfirebase/issues) for questions and troubleshooting help.
