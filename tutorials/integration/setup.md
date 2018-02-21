# Tutorial: Integration

This tutorial shows how to create a mock of the SDK to use in your test code.  Refer to one of the tutorials for examples on how to use this mocked SDK.
- [Proxyquire](proxyquire.md)
- [Jest](jest.md)
- [Window Override](window.md)

```js
var firebasemock    = require('firebase-mock');

var mockauth = new firebasemock.MockFirebase();
var mockdatabase = new firebasemock.MockFirebase();
var mockfirestore = new firebasemock.MockFirestore();
var mocksdk = new firebasemock.MockFirebaseSdk(
  // use null as first argument if your code does not use RTDB
  (path) => {
    return path ? mockdatabase.child(path) : mockdatabase;
  },
  () => {
    return mockauth;
  },
  // use null as third argument (or leave blank) if your code does not use FIRESTORE
  () => {
    return mockfirestore;
  }
);
```
