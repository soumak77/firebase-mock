# Tutorial: Overriding `require('firebase')`

In Node/Browserify, you need to patch `require` itself to override `firebase` calls. The trio of [proxyquire](https://github.com/thlorenz/proxyquire) (Node), [proxyquireify](https://github.com/thlorenz/proxyquireify) (Browserify), and [proxyquire-universal](https://github.com/bendrucker/proxyquire-universal) (both) make this easy.

##### Source

```js
// ./mySrc.js
var firebase = require('firebase');
var ref = firebase.database().ref('myRefUrl');
ref.on('value', function (snapshot) {
  console.log(snapshot.val());
});
```

##### Test

```js
// ./test.js
var proxyquire   = require('proxyquire');
var firebasemock    = require('firebase-mock');

var mockdatabase = new firebasemock.MockFirebase();
var mockauth = new firebasemock.MockFirebase();
var mocksdk = firebasemock.MockFirebaseSdk(function(path) {
  return mockdatabase.child(path);
}, function() {
  return mockauth;
});
var mySrc = proxyquire('./mySrc', {
  firebase: mocksdk
});
mock.flush();
// data is logged
```
