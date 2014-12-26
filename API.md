# API Reference

Only `MockFirebase` methods are included here. For details on normal Firebase API methods, consult the [Firebase Web API documentation](https://www.firebase.com/docs/web/api/).

- [Core](#core)
  - [`flush([delay])`](#flushdelay---ref)
  - [`autoFlush([delay])`](#autoflushdelaysetting---ref)
  - [`splitQueue()`](#splitqueue---undefined)
  - [`joinQueue()`](#joinqueue---undefined)
  - [`failNext(method, err)`](#failnextmethod-err---undefined)
  - [`forceCancel(err [, event] [, callback] [, context]`)](#forcecancelerr--event--callback--context---undefined)
  - [`getData()`](#getdata---any)
  - [`getKeys()`](#getkeys---array)
  - [`fakeEvent(event [, key] [, data] [, previousChild] [, priority])`](#fakeeventevent--key--data--previouschild--priority---ref)
- [Auth](#auth)
  - [`changeAuthState(user)`](#changeauthstateauthdata---undefined)
  - [`getEmailUser(email)`](#getemailuseremail---objectnull)

## Core

Core methods of `MockFirebase` references for manipulating data and asynchronous behavior. 

##### `flush([delay])` -> `ref`

Flushes the queue of deferred data and authentication operations. If a `delay` is passed, the flush operation will be triggered after the specified number of milliseconds. 

In MockFirebase, data operations can be executed synchronously. When calling any Firebase API method that reads or writes data (e.g. `set(data)` or `on('value')`), MockFirebase will queue the operation. You can call multiple data methods in a row before flushing. MockFirebase will execute them in the order they were called when `flush` is called.

`flush` will throw an exception if the queue of deferred operations is empty.

Example:

```js
ref.set({
  foo: 'bar'
});
console.assert(ref.getData() === null, 'ref does not have data');
ref.flush();
console.assert(ref.getData().foo === 'bar', 'ref has data');
```

<hr>

##### `autoFlush([delay|setting])` -> `ref`

Configures the Firebase reference to automatically flush data and authentication operations when run. If no arguments or `true` are passed, the operations will be flushed immediately (synchronously). If a `delay` is provided, the operations will be flushed after the specified number of milliseconds. If `false` is provided, `autoFlush` will be disabled.

<hr>

##### `splitQueue()` -> `undefined`

Normally all child paths inherit the event queue from their parent reference. Calling `ref.flush` on a reference with listeners at child paths would normally fire all listeners and persist pending data changes. You can override this behavior by calling `splitQueue` on a path to detach the queue from the parent. You should call this before adding listeners or changing data.

<hr>

##### `joinQueue()` -> `undefined`

After calling `splitQueue`, `joinQueue` will restore the normal behavior and reconnect the child flush queue to the parent. Any existing queued events on the child will be lost.

<hr>

##### `failNext(method, err)` -> `undefined`

When `method` is next invoked, trigger the `onComplete` callback with the specified `err`. This is useful for simulating validation, authorization, or any other errors. The callback will be triggered with the next `flush`. 

`err` must be a proper `Error` object and not a string or any other primitive. 

Example:

```js
var error = new Error('Oh no!');
ref.failNext('set', error);
var err;
ref.set('data', function onComplete (_err_) {
  err = _err_;
});
console.assert(typeof err === 'undefined', 'no err');
ref.flush();
console.assert(err === error, 'err passed to callback');
```

<hr>

##### `forceCancel(err [, event] [, callback] [, context]` -> `undefined`

Simulate a security error by cancelling listeners (callbacks registered with `on`) at the path with the specified `err`. If an optional `event`, `callback`, and `context` are provided, only listeners that match will be cancelled. `forceCancel` will also invoke `off` for the matched listeners so they will be no longer notified of any future changes. Cancellation is triggered immediately and not with a `flush` call. 

Example:

```js
var error = new Error();
function onValue (snapshot) {}
function onCancel (_err_) {
  err = _err_; 
}
ref.on('value', onValue, onCancel);
ref.flush();
ref.forceCancel(error, 'value', onValue);
console.assert(err === error, 'err passed to onCancel');
```

<hr>

##### `getData()` -> `Any`

Returns a copy of the data as it exists at the time. Any writes must be triggered with `flush` before `getData` will reflect their results.

<hr>

##### `getKeys()` -> `Array`

Returns an array of the keys at the path as they are ordered in Firebase.

<hr>

##### `fakeEvent(event [, key] [, data] [, previousChild] [, priority])` -> `ref`

Triggers a fake event that is not connected to an actual change to Firebase data. A child `key` is required unless the event is a `'value'` event. 

Example:

```js
var snapshot;
function onValue (_snapshot_) {
  snapshot = _snapshot_;
}
ref.on('value', onValue);
ref.set({
  foo: 'bar';
});
ref.flush();
console.assert(ref.getData().foo === 'bar', 'data has foo');
ref.fakeEvent('value', undefined, null);
ref.flush();
console.assert(ref.getData() === null, 'data is null');
```

<hr>

## Auth

Authentication methods for simulating changes to the auth state of a Firebase reference.

##### `changeAuthState(authData)` -> `undefined`

Changes the active authentication credentials to the `authData` object. Before changing the authentication state, `changeAuthState` checks whether the `authData` object is deeply equal to the current authentication data. `onAuth` listeners will only be triggered if the data is not deeply equal. To simulate no user being authenticated, pass `null` for `authData`. This operation is queued until the next `flush`. 

`authData` should adhere to the [documented schema](https://www.firebase.com/docs/web/api/firebase/onauth.html).

Example:

```js
ref.changeAuthState({
  uid: 'theUid',
  provider: 'github',
  token: 'theToken',
  expires: Math.floor(new Date() / 1000) + 24 * 60 * 60, // expire in 24 hours
  auth: {
    myAuthProperty: true
  }
});
ref.flush();
console.assert(ref.getAuth().auth.myAuthProperty, 'authData has custom property');
```

<hr>

##### `getEmailUser(email)` -> `Object|null`

Finds a user previously created with [`createUser`](https://www.firebase.com/docs/web/api/firebase/createuser.html). If no user was created with the specified `email`, `null` is returned instead.

