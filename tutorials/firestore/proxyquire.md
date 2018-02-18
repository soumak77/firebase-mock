# Tutorial: Overriding `require('firebase')`

In Node/Browserify, you need to patch `require` itself to override `firebase` calls. The trio of [proxyquire](https://github.com/thlorenz/proxyquire) (Node), [proxyquireify](https://github.com/thlorenz/proxyquireify) (Browserify), and [proxyquire-universal](https://github.com/bendrucker/proxyquire-universal) (both) make this easy.

##### Source

```js
// ./mySrc.js
var firebase = require('firebase');
var ref = firebase.firestore().doc('users/123');
ref.get().then(function(doc) {
  console.log(doc.data());
}).catch(function(err) {
  console.error(err);
});
```

##### Test

```js
// ./test.js
var proxyquire   = require('proxyquire');
var firebasemock    = require('firebase-mock');

var mockauth        = new firebasemock.MockFirebase();
var mockfirestore   = new firebasemock.MockFirestore();
var mocksdk         = firebasemock.MockFirebaseSdk(null, function() {
  return mockauth;
}, function() {
  return mockfirestore;
});
var mySrc = proxyquire('./mySrc', {
  firebase: mocksdk
});
mockfirestore.flush();
// data is logged
```
