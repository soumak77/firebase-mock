# Tutorial: Integration

This tutorial shows how to create a mock of the SDK to use in your test code.  Refer to one of the tutorials for examples on how to use this mocked SDK.
- [Proxyquire](proxyquire.md)
- [Jest](jest.md)
- [Window Override](window.md)

```js
var firebasemock    = require('firebase-mock');

var mockauth = new firebasemock.MockAuthentication();
var mockdatabase = new firebasemock.MockFirebase();
var mockfirestore = new firebasemock.MockFirestore();
var mockstorage = new firebasemock.MockStorage();
var mockmessaging = new firebasemock.MockMessaging();
var mocksdk = new firebasemock.MockFirebaseSdk(
  // use null if your code does not use RTDB
  (path) => {
    return path ? mockdatabase.child(path) : mockdatabase;
  },
  // use null if your code does not use AUTHENTICATION
  () => {
    return mockauth;
  },
  // use null if your code does not use FIRESTORE
  () => {
    return mockfirestore;
  },
  // use null if your code does not use STORAGE
  () => {
    return mockstorage;
  },
  // use null if your code does not use MESSAGING
  () => {
    return mockmessaging;
  }
);
```
