Firebase Mock [![Build Status](https://travis-ci.org/soumak77/firebase-mock.svg?branch=master)](https://travis-ci.org/soumak77/firebase-mock)
============

Firebase Mock extends [mockfirebase](https://github.com/katowulf/mockfirebase) to provide support for the following Firebase Javascript SDKS:
- [firebase](https://github.com/firebase/firebase-js-sdk)
- [firebase-admin](https://github.com/firebase/firebase-admin-node)
- [firebase-functions](https://github.com/firebase/firebase-functions)

## Setup
```bash
npm install firebase-mock --save-dev
```
Follow the steps in the [Setup Tutorial](tutorials/integration/setup.md) to create a mock SDK to be used in your tests.  Then follow one of the tutorials below based on your testing framework:
* [Proxyquire](tutorials/integration/proxyquire.md)
* [Jest](tutorials/integration/jest.md)
* [Window Override](tutorials/integration/window.md)

## API

Firebase Mock supports the client-side [JavaScript API](https://firebase.google.com/docs/reference/js/) and server-side [Admin API](https://firebase.google.com/docs/reference/admin/node/) plus a small set of utility methods documented fully in the [API Reference](API.md). Rather than make a server call that is actually asynchronous, Firebase Mock allows you to either trigger callbacks synchronously or asynchronously with a specified delay ([`ref.flush`](API.md#flushdelay---ref)).

## Tutorials
### Client ([firebase](https://github.com/firebase/firebase-js-sdk))
* Authentication
  * [Basic](tutorials/client/auth/authentication.md)
  * [JWT Tokens](tutorials/client/auth/tokens.md)
* Realtime Database
  * [Basic](tutorials/client/rtdb/basic.md)
  * [Simulating Errors](tutorials/client/rtdb/errors.md)
  * [Ordering](tutorials/client/rtdb/spies.md)
* [Firestore](tutorials/client/firestore.md)
* [Storage](tutorials/client/storage.md)

### Admin ([firebase-admin](https://github.com/firebase/firebase-admin-node))
* Authentication
  * [Basic](tutorials/admin/authentication.md)
  * [JWT Tokens](tutorials/admin/tokens.md)
* [Realtime Database](tutorials/admin/rtdb.md)
* [Firestore](tutorials/admin/firestore.md)
* [Storage](tutorials/admin/storage.md)

### Functions ([firebase-functions](https://github.com/firebase/firebase-functions))
* [Realtime Database](tutorials/functions/rtdb.md)
* [Firestore](tutorials/functions/firestore.md)
* [HTTP](tutorials/functions/http.md)

## Alternatives
* [firebase-server](https://github.com/urish/firebase-server)
* [firebase-functions-test](https://firebase.google.com/docs/functions/unit-testing)
