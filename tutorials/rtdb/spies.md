# Tutorial: Using Spies for Ordering

`firebase-mock` does not provide mocked behavior for orderBy* methods due to the complex way in which data is ordered by firebase.  The mocks provided for `orderByChild`, `orderByKey`, `orderByPriority`, and `orderByValue` are simply pass through methods and do not provide any filtering on the data.  This allows your firebase code to execute during testing, though the results will not be as you expect.

In order to have the orderBy* methods work as expected in your unit tests, you'll have to use `spies`.  Spies provide a way to intercept the call to the orderBy* method and return data that your source code is expecting.  Since your unit tests are written with known inputs and outputs, your test code should know exactly what the orderBy* spy should return.

The example below shows how to use spies using `sinon`

##### Source

```js
// ./myFunction.js
var firebase = require('firebase');

module.exports = function() {
  var ref = firebase.database().ref('myRefUrl');
  var query = ref.orderByChild('name').equalTo('bob');
  query.once('value', function (snapshot) {
    var keys = Object.keys(snapshot.val());
    console.log("Total keys: " + keys.length);
  });
}
```

##### Test

```js
// ./test.js
var sinon         = require('sinon');
var proxyquire    = require('proxyquire');
var firebasemock  = require('firebase-mock');

var mockdatabase  = new firebasemock.MockFirebase();
var mockauth      = new firebasemock.MockFirebase();
var mocksdk       = firebasemock.MockFirebaseSdk(function(path) {
  return mockdatabase.child(path);
}, function() {
  return mockauth;
});
var myFunction    = proxyquire('./myFunction', {
  firebase: mocksdk
});

mockdatabase.child('myRefUrl').child('key1').set({ name: 'abe' });
mockdatabase.child('myRefUrl').child('key2').set({ name: 'bob' });
mockdatabase.flush();

// The mocks for orderByChild and equalTo will return the entire dataset at the current reference.
// This causes myFunction to log the value 2 without any spies being configured
myFunction();
mockdatabase.flush(); // logs "Total keys: 2"

// We can stub out the orderByChild so that it returns the data we need in our source code.
// This causes myFunction to log the value 1 since our spy is configured to only return the matched data.
sinon.stub(mockdatabase.child('myRefUrl'), 'orderByChild').callsFake(function() {
  return {
    equalTo: function() {
      return {
        once: function() {
          return Promise.resolve({
            val: function() {
              return {
                key2: {
                  name: 'bob'
                }
              };
            }
          });
        }
      }
    }
  };
});
myFunction(); // logs "Total keys: 1"
```
