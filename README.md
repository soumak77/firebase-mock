MockFirebase [![Build Status](https://travis-ci.org/katowulf/mockfirebase.svg?branch=master)](https://travis-ci.org/katowulf/mockfirebase)
============

*This is an experimental library and is not supported by Firebase*

## Setup

### Node/Browserify

```bash
$ npm install mockfirebase
```

```js
var MockFirebase = require('mockfirebase').MockFirebase;
```

### AMD/Browser

```bash
$ bower install mockfirebase
```

```html
<script src="./bower_components/mockfirebase/browser/mockfirebase.js"></script>
```

## API

MockFirebase supports the normal [Firebase API](https://www.firebase.com/docs/web/api/) plus a small set of utility methods documented fully in the [API Reference](API.md). Rather than make a server call that is actually asynchronous, MockFirebase allow you to either trigger callbacks synchronously or asynchronously with a specified delay ([`ref.flush`](API.md#flushdelay---ref)).

## Tutorials

* [Basic](tutorials/basic.md)
* [Authentication](tutorials/authentication.md)
* [Simulating Errors](tutorials/errors.md)
* [Overriding `window.Firebase`](tutorials/override.md)
* [Overriding `require('firebase')`](tutorials/proxyquire.md)