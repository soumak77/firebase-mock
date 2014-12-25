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
