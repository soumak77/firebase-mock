Firebase Mock [![Build Status](https://travis-ci.org/soumak77/firebase-mock.svg?branch=master)](https://travis-ci.org/soumak77/firebase-mock)
============

Firebase Mock extends [mockfirebase](https://github.com/katowulf/mockfirebase) to provide support for Firebase 3.0.

## Setup

### Node

```bash
$ npm install firebase-mock
```

```js
var MockFirebase = require('firebase-mock').MockFirebase;
```

### AMD/Browser

```bash
$ bower install firebase-mock
```

```html
<script src="./bower_components/firebase-mock/browser/firebasemock.js"></script>
```

## API

Firebase Mock supports the normal [Firebase API](https://firebase.google.com/docs/reference/js/) plus a small set of utility methods documented fully in the [API Reference](API.md). Rather than make a server call that is actually asynchronous, MockFirebase allow you to either trigger callbacks synchronously or asynchronously with a specified delay ([`ref.flush`](API.md#flushdelay---ref)).

## Tutorials

### Authentication
* [Authentication](tutorials/auth/authentication.md)

### Realtime Database
* [Basic](tutorials/rtdb/basic.md)
* [Simulating Errors](tutorials/rtdb/errors.md)
* [Overriding `window.Firebase`](tutorials/rtdb/override.md)
* [Overriding `require('firebase')`](tutorials/rtdb/proxyquire.md)
* [Using Spies for Ordering](tutorials/rtdb/spies.md)
* [Cloud Events](tutorials/rtdb/cloudevents.md)

### Firestore
* [Cloud Events](tutorials/firestore/cloudevents.md)

## Projects using firebase-mock
* [Angular Base Apps Template](https://github.com/base-apps/angular-firebase-template)
