# Tutorial: Firebase Mock Basics

When writing unit tests with Firebase Mock, you'll typically want to focus on covering one of two scenarios:

1. Your client receives data from Firestore using a method like `get`
2. Your client writes data to Firestore using a method like `set`, `create` or `update`

While your application almost certainly does both reading and writing to Firestore, each test should try to cover as small a unit of functionality as possible.

## Testing Reads

In this example, our source code will listen for new people on a reference we provide and call a function each time a new one is added.

##### Source

```js
var collection;
var people = {
  collection: function () {
    if (!collection) collection = firebase.firestore().collection('people');
    return collection;
  },
  greet: function (person) {
    console.log('hi ' + person.first);
  },
  process: function () {
    people.collection().get().then(function(snaps) {
      snaps.forEach(function(doc) {
        people.greet(doc.data());
      });
    });
  }
};
```

In our tests, we'll override the `greet` method to verify that it's being called properly.

##### Test

```js
MockFirebase.override();
var greeted = [];
people.greet = function (person) {
  greeted.push(person);
};
people.collection().add({
  first: 'Michael'
});
people.collection().add({
  first: 'Ben'
});
people.process();
people.collection().flush();
console.assert(greeted.length === 2, '2 people greeted');
console.assert(greeted[0].first === 'Michael', 'Michael greeted');
console.assert(greeted[1].first === 'Ben', 'Ben greeted');
```

We're calling [`MockFirebase.override`](override.md) to replace the real `Firebase` instance with Firebase Mock. If you're loading Firebase using Node or Browserify, you need to use [proxyquire](proxyquire.md) instead.

Notice that we queued up multiple changes before actually calling `ref.flush`. Firebase Mock stores these changes in the order they were created and then performs local updates accordingly. You'll only need to `flush` your changes when you need listeners, callbacks, and other asynchronous responses to be triggered.

## Testing Writes

Testing writes is especially easy with Firebase Mock because it allows you to inspect the state of your data at any time. In this example, we'll add a new method to `people` that creates a new person with the given name:

##### Source

```js
people.create = function (first) {
  return people.collection().add({
    first: first
  });
};
```

##### Test

```js
var newPersonRef = people.create('James');
newPersonRef.then(function(doc) {
  console.assert(doc.get('first') === 'James', 'James was created');
});
people.collection().flush();
```
