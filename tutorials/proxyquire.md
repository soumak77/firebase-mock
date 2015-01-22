# Tutorial: Overriding `require('firebase')`

In Node/Browserify, you need to patch `require` itself to override `Firebase` calls. The trio of [proxyquire](https://github.com/thlorenz/proxyquire) (Node), [proxyquireify](https://github.com/thlorenz/proxyquireify) (Browserify), and [proxyquire-universal](https://github.com/bendrucker/proxyquire-universal) (both) make this easy.

##### Source

```js
// ./mySrc.js
var Firebase = require('firebase');
var ref = new Firebase('myRefUrl');
ref.on('value', function (snapshot) {
  console.log(snapshot.val());
});
```

##### Test

```js
// ./test.js
var proxyquire   = require('proxyquire');
var MockFirebase = require('mockfirebase').MockFirebase;
var mock;
var mySrc = proxyquire('./mySrc', {
  firebase: function (url) {
    return (mock = new MockFirebase(url));
  };
});
mock.flush();
// data is logged
```
