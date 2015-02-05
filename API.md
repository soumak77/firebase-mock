# API Reference

Only `MockFirebase` methods are included here. For details on normal Firebase API methods, consult the [Firebase Web API documentation](https://www.firebase.com/docs/web/api/).

- [Core](#core)
  - [`flush([delay])`](#flushdelay---ref)
  - [`autoFlush([delay])`](#autoflushdelaysetting---ref)
  - [`failNext(method, err)`](#failnextmethod-err---undefined)
  - [`forceCancel(err [, event] [, callback] [, context]`)](#forcecancelerr--event--callback--context---undefined)
  - [`getData()`](#getdata---any)
  - [`getKeys()`](#getkeys---array)
  - [`fakeEvent(event [, key] [, data] [, previousChild] [, priority])`](#fakeeventevent--key--data--previouschild--priority---ref)
  - [`getFlushQueue()`](#getflushqueue---array)
- [Auth](#auth)
  - [`changeAuthState(user)`](#changeauthstateauthdata---undefined)
  - [`getEmailUser(email)`](#getemailuseremail---objectnull)
- [Server Timestamps](#server-timestamps)
  - [`setClock(fn)`](#firebasesetclockfn---undefined)
  - [`restoreClock()`](#firebasesetclockfn---undefined)

## Core

Core methods of `MockFirebase` references for manipulating data and asynchronous behavior. 

##### `flush([delay])` -> `ref`

Flushes the queue of deferred data and authentication operations. If a `delay` is passed, the flush operation will be triggered after the specified number of milliseconds. 

In MockFirebase, data operations can be executed synchronously. When calling any Firebase API method that reads or writes data (e.g. `set(data)` or `on('value')`), MockFirebase will queue the operation. You can call multiple data methods in a row before flushing. MockFirebase will execute them in the order they were called when `flush` is called. If you trigger an operation inside of another (e.g. writing data somewhere when you detect a data change using `on`), all changes will be performed during the same `flush`. 

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

##### `getFlushQueue()` -> `Array`

Returns a list of all the `event` objects queued to be run the next time `ref.flush` is invoked.
These items can be manipulated manually by calling `event.run` or `event.cancel`. Each contains
a `sourceMethod` and `sourceArguments` attribute that can be used to identify specific
calls to a MockFirebase method.

This is a copy of the internal array and represents the state of the flush queue at the time `getFlushQueue` is called.

Example:

```js
// create some child_added events
var ref = new MockFirebase('OutOfOrderFlushEvents://');

var child1 = ref.push('foo');
var child2 = ref.push('bar');
var child3 = ref.push('baz');
var events = ref.getFlushQueue();

var sourceData = events[0].sourceData;
console.assert(sourceData.ref === child2, 'first event is for child1');
console.assert(sourceData.method, 'first event is a push');
console.assert(sourceData.args[0], 'push was called with "bar"');

ref.on('child_added', function (snap, prevChild) {
   console.log('added ' + snap.val() + ' after ' + prevChild);
});

// cancel the second push so it never triggers a event
events[1].cancel();
// trigger the third push before the first
events[2].run(); // added baz after bar
// now flush the remainder of the queue normally
ref.flush(); // added foo after null
```

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

## Server Timestamps

MockFirebase allow you to simulate the behavior of [server timestamps](https://www.firebase.com/docs/web/api/servervalue/timestamp.html) when using a real Firebase instance. Unless you use `Firebase.setClock`, `Firebase.ServerValue.TIMESTAMP` will be transformed to the current date (`Date.now()`) when your data change is flushed. 

##### `Firebase.setClock(fn)` -> `undefined`

Instead of using `Date.now()`, MockFirebase will call the `fn` you provide to generate a timestamp. `fn` should return a number.

<hr>

##### `Firebase.restoreClock()` -> `undefined`

After calling `Firebase.setClock`, calling `Firebase.restoreClock` will restore the default timestamp behavior.
