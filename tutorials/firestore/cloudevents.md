# Tutorial: Mocking Firestore Cloud Events
`firebase-functions` does not provide a firestore equivalent to `functions.database.DeltaSnapshot`.  Therefore you will need to use the provided `firebasemock.DeltaDocumentSnapshot` method from this library in order to mock firestore cloud events.  The method signature is shown below:

```
DeltaDocumentSnapshot(adminApp: firebase.app.App, data: any, delta: any, path: string);
```

## Source Code
```js
var functions = require('firebase-functions');

const create = function(event) {
};

const update = function(event) {
};

const remove = function(event) {
};

functions.firestore.document('users/{uid}').onCreate(create);
functions.firestore.document('users/{uid}').onUpdate(update);
functions.firestore.document('users/{uid}').onDelete(remove);
```

## Test Code
```js
'use strict';

var sinon           = require('sinon');
var expect          = require('chai').use(require('sinon-chai')).expect;
var _               = require('lodash');
var firebasemock    = require('../../');
var mockauth        = new firebasemock.MockFirebase();
var mockfirestore   = new firebasemock.MockFirestore();
var mocksdk         = firebasemock.MockFirebaseSdk(null, function() {
  return mockauth;
}, function() {
  return mockfirestore;
});
var mockapp = mocksdk.initializeApp();

describe('Firebase Functions', function () {
  beforeEach(function() {
    mockfirestore = new firebasemock.MockFirestore();
    mockfirestore.autoFlush();
    mockauth = new firebasemock.MockFirebase();
    mockauth.autoFlush();
  });

  var uid = '123';

  it('create', function() {
    var create = function(event) {
      expect(event.data.get('name')).to.equal('bob');
      expect(event.params.uid).to.equal(uid);
    };

    var event = {
      data: new firebasemock.DeltaDocumentSnapshot(mockapp, null, {
        name: 'bob',
        createdTime: new Date()
      }, 'users/' + uid),
      params: {
        uid: uid
      }
    };

    create(event);
  });

  it('update', function() {
    var update = function(event) {
      expect(event.data.previous.get('name')).to.equal('bob');
      expect(event.data.get('name')).to.equal('bobby');
      expect(event.params.uid).to.equal(uid);
    };

    var event = {
      data: new firebasemock.DeltaDocumentSnapshot(mockapp, {
        name: 'bob',
        createdTime: new Date()
      }, {
        name: 'bobby'
      }, 'users/' + uid),
      params: {
        uid: uid
      }
    };

    update(event);
  });

  it('delete', function() {
    var del = function(event) {
      expect(event.data.previous.get('name')).to.equal('bob');
      expect(event.params.uid).to.equal(uid);
    };

    var event = {
      data: new firebasemock.DeltaDocumentSnapshot(mockapp, {
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
