# Tutorial: Mocking Http Functions
Testing HTTP methods is made simple with [node-mocks-http](https://github.com/howardabrams/node-mocks-http)

## Source Code
```js
// triggers.js
var admin = require('firebase-admin');
var express = require('express');

function getUser(req, res) {
  admin.firestore.collection('users').doc(req.params.uid).get().then(doc => {
    res.json(doc.data());
  }).catch(err => {
    res.status(500).send('Error');
  });
}

function createApp() {
  var app = express();
  app.get('/users/:uid', getUser);
  return app;
}

module.exports = {
  createApp: createApp,
  getUser: getUser
};
```

```js
// index.js
var triggers = require('./triggers');
var functions = require('firebase-functions');

functions.https.onRequest(triggers.createApp());
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

var triggers = proxyquire('./triggers', {
  'firebase-admin': mocksdk
});

describe('Http Function', function () {
  beforeEach(function() {
    mockfirestore = new firebasemock.MockFirestore();
    mockfirestore.autoFlush();
    mockauth = new firebasemock.MockFirebase();
    mockauth.autoFlush();

    if (null == this.sinon) {
      this.sinon = sinon.sandbox.create();
    } else {
      this.sinon.restore();
    }
  });

  it('should succeed', function() {
    mockfirestore.doc('users/123').set({
      name: 'bob'
    });

    var request  = httpMocks.createRequest({
      method: 'GET',
      url: `/users/123`,
      params: {
        uid: '123'
      }
    });
    var response = httpMocks.createResponse();

    triggers.getUser(request, response);
    var user = JSON.parse(response._getData());
    expect(user).to.have.property('name').to.equal('bob');

    expect(response.statusCode).to.equal(200);
    expect(response._isEndCalled()).to.be.true;
    expect(response._isJSON()).to.be.true;
  });
});
```
