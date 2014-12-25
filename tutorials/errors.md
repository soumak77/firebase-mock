# Tutorial: Simulating Errors

Except for user management methods like `createUser` that validate their arguments, MockFirebase calls will never results in asynchronous errors since all data is maintained locally. Instead, MockFirebase gives you two options for testing error handling behavior for both data and authentication methods:

1. [`failNext(method, err)`](../API.md#failnextmethod-err---undefined): specifies that the next invocation of `method` should call its completion callback with `err`
2. [`forceCancel(err [, event] [, callback] [, context]`)](../API.md#forcecancelerr--event--callback--context---undefined): cancels all data event listeners registered with `on` that match the provided arguments

While `failNext` is limited to specifying a single error per method, `forceCancel` can simulate the cancellation of any number of event listeners.

## `failNext`

Using `failNext` is a simple way to test behavior that handles write errors or read errors that occur immediately (e.g. an attempt to read a path a user is not authorized to view). 


##### Source

```js
var log = {
  error: function (err) {
    console.error(err);
  }
};
var people = {
  ref: function () {
    return new Firebase('htttps://example.firebaseio.com/people')
  },
  create: function (person) {
    people.ref().push(person, function (err) {
      if (err) log.error(err);
    });
  }
};
```

In our tests, we'll override `log.error` to ensure that it's properly called.

##### Test

```js
MockFirebase.override();
var ref = people.ref();
var errors = [];
log.error = function (err) {
  errors.push(err);
};
people.failNext('push');
people.create({
  first: 'Ben'
});
people.flush();
console.assert(errors.length === 1, 'people.create error logged');
```

## `forceCancel`

`forceCancel` simulates more complex errors that involve a set of event listeners on a path. `forceCancel` allows you to simulate Firebase API behavior that would normally occur in rare cases when a user lost access to a particular reference. For a simple read error, you could use `failNext('on', err)` instead.

In this example, we'll also record an error when we lose authentication on a path.

##### Source
```js
people.ref().on('child_added', function onChildAdded (snapshot) {
  console.log(snapshot.val().first);
}, function onCancel () {
  log.error(err);
});
```

##### Test

```js
var errors = [];
log.error = function (err) {
  errors.push(err);
};
var err = new Error();
people.forceCancel(err, 'child_added');
console.assert(errors.length === 1, 'child_added was cancelled');
```
