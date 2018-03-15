# Tutorial: Mocking Realtime Database Functions
Read more at https://firebase.google.com/docs/functions/unit-testing

```
DeltaSnapshot(app: firebase.app.App, adminApp: firebase.app.App, data: any, delta: any, path?: string);
```

## Test Code
```js
var functions = require('firebase-functions');
var sinon    = require('sinon');
var expect   = require('chai').use(require('sinon-chai')).expect;
var firebasemock    = require('firebase-mock');
var mockauth        = new firebasemock.MockFirebase();
var mockdatabase   = new firebasemock.MockFirebase();
var mocksdk         = firebasemock.MockFirebaseSdk(function(path) {
  return path ? mockdatabase.child(path) : mockdatabase;
}, function() {
  return mockauth;
});
var mockapp = mocksdk.initializeApp();

describe('Realtime Database Functions', function () {
  beforeEach(function() {
    mockdatabase = new firebasemock.MockFirebase();
    mockdatabase.autoFlush();
    mockauth = new firebasemock.MockFirebase();
    mockauth.autoFlush();
  });

  var uid = '123';

  it('create', function() {
    var create = function(event) {
      expect(event.data.previous.child('name').val()).to.equal('bob');
      expect(event.data.child('name').val()).to.equal('bobby');
      expect(event.params.uid).to.equal(uid);
    };

    var event = {
      data: new functions.database.DeltaSnapshot(mockapp, mockapp, {
        name: 'bob',
        createdTime: new Date()
      }, {
        name: 'bobby'
      }, 'users/' + uid),
      params: {
        uid: uid
      }
    };

    create(event);
  });

  it('update', function() {
    var update = function(event) {
      expect(event.data.child('name').val()).to.equal('bob');
      expect(event.params.uid).to.equal(uid);
    };

    var event = {
      data: new functions.database.DeltaSnapshot(mockapp, mockapp, null, {
        name: 'bob',
        createdTime: new Date()
      }, 'users/' + uid),
      params: {
        uid: uid
      }
    };

    update(event);
  });

  it('delete', function() {
    var del = function(event) {
      expect(event.data.previous.child('name').val()).to.equal('bob');
      expect(event.params.uid).to.equal(uid);
    };

    var event = {
      data: new functions.database.DeltaSnapshot(mockapp, mockapp, {
        name: 'bob',
        createdTime: new Date()
      }, null, 'users/' + uid),
      params: {
        uid: uid
      }
    };

    del(event);
  });
});
```
