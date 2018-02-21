# Tutorial: Integrating with proxyquire

In Node/Browserify, you need to patch `require` itself to override `firebase` calls. The trio of [proxyquire](https://github.com/thlorenz/proxyquire) (Node), [proxyquireify](https://github.com/thlorenz/proxyquireify) (Browserify), and [proxyquire-universal](https://github.com/bendrucker/proxyquire-universal) (both) make this easy.

## Examples

### RTDB

#### Source
```js
// ./mySrc.js
var firebase = require('firebase');
var ref = firebase.database().ref('myRefUrl');
ref.on('value', function (snapshot) {
  console.log(snapshot.val());
});
```

#### Test
```js
var proxyquire   = require('proxyquire');

var mySrc = proxyquire('./mySrc', {
  firebase: mocksdk
});
mocksdk.database().flush();
// data is logged
```

### Firestore

#### Source

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

#### Test

```js
// ./test.js
var mySrc = proxyquire('./mySrc', {
  firebase: mocksdk
});
mocksdk.firestore().flush();
// data is logged
```
