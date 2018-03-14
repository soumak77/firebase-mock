# Tutorial: Mocking Firestore Functions
`firebase-functions` does not provide a firestore equivalent to `functions.database.DeltaSnapshot`.  Therefore you will need to use the provided `firebasemock.DeltaDocumentSnapshot` method from this library in order to mock firestore cloud events.  The method signature is shown below:

```
DeltaDocumentSnapshot(adminApp: firebase.app.App, data: any, delta: any, path: string);
```

## Source Code
```js
// triggers.js
var admin = require('firebase-admin');

function create(event) {
  console.log(event.params.uid);
}

function update(event) {
  console.log(event.params.uid);
}

function remove(event) {
  console.log(event.params.uid);
}

module.exports = {
  create: create,
  update: update,
  remove: remove
}
```

```js
// index.js
var functions = require('firebase-functions');
var triggers = require('./triggers');

functions.firestore.document('users/{uid}').onCreate(triggers.create);
functions.firestore.document('users/{uid}').onUpdate(triggers.update);
functions.firestore.document('users/{uid}').onDelete(triggers.remove);
```

## Test Code
```js
var proxyquire      = require('proxyquire');
var sinon           = require('sinon');
var expect          = require('chai').use(require('sinon-chai')).expect;
var firebasemock    = require('firebase-mock');
var mockauth        = new firebasemock.MockFirebase();
var mockfirestore   = new firebasemock.MockFirestore();
var mocksdk         = firebasemock.MockFirebaseSdk(null, function() {
  return mockauth;
}, function() {
  return mockfirestore;
});
var mockapp = mocksdk.initializeApp();

var triggers = proxyquire('./triggers', {
  'firebase-admin': mocksdk
});

describe('Firestore Function', function () {
  beforeEach(function() {
    mockfirestore = new firebasemock.MockFirestore();
    mockfirestore.autoFlush();
    mockauth = new firebasemock.MockFirebase();
    mockauth.autoFlush();
  });

  var uid = '123';

  it('create', function() {
    var event = {
      data: new firebasemock.DeltaDocumentSnapshot(mockapp, null, {
        name: 'bob',
        createdTime: new Date()
      }, 'users/' + uid),
      params: {
        uid: uid
      }
    };

    expect(event.data.get('name')).to.equal('bob');
    expect(event.params.uid).to.equal(uid);

    triggers.create(event);
  });

  it('update', function() {
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

    expect(event.data.previous.get('name')).to.equal('bob');
    expect(event.data.get('name')).to.equal('bobby');
    expect(event.params.uid).to.equal(uid);

    triggers.update(event);
  });

  it('delete', function() {
    var event = {
      data: new firebasemock.DeltaDocumentSnapshot(mockapp, {
        name: 'bob',
        createdTime: new Date()
      }, null, 'users/' + uid),
      params: {
        uid: uid
      }
    };

    expect(event.data.previous.get('name')).to.equal('bob');
    expect(event.params.uid).to.equal(uid);

    triggers.remove(event);
  });
});
```
