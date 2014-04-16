
var sinon = require('sinon');
var _ = require('lodash');
var expect = require('chai').use(require('sinon-chai')).expect;
var Mock = require('../MockFirebase.js');
var Firebase = Mock.Firebase;
var FirebaseSimpleLogin = Mock.FirebaseSimpleLogin;

describe('MockFirebase', function() {
  var fb;

  beforeEach(function() {
    fb = new Firebase().child('data');
  });

  it('should have test units');
});

describe('MockFirebaseSimpleLogin', function() {
  var fb, callback, auth;

  beforeEach(function() {
    callback = sinon.spy();
    fb = new Firebase().child('data');
    auth= new FirebaseSimpleLogin(fb, callback);
  });

  describe('#login', function() {
    it('should invoke the callback if autoFlush is set', function() {
      auth.autoFlush(true).login('twitter');
      expect(callback.callCount).equals(1);
    });

    it('should wait for flush', function() {
      auth.login('twitter');
      expect(callback.callCount).equals(0);
      auth.flush();
      expect(callback.callCount).equals(1);
    });

    it('should return INVALID_USER on bad email address', function() {
      auth.autoFlush(true).login('password', {email: 'bademail', password: 'notagoodpassword'});
      var call = callback.getCall(0);
      expect(call.args[0]).is.an('object');
      expect(call.args[0].code).equals('INVALID_USER');
    });

    it('should return INVALID_PASSWORD on an invalid password', function() {
      auth.autoFlush(true).login('password', {email: 'email@firebase.com', password: 'notagoodpassword'});
      var call = callback.getCall(0);
      expect(call.args[0]).is.an('object');
      expect(call.args[0].code).equals('INVALID_PASSWORD');
    });

    it('should return a valid user on a good login', function() {
      auth.autoFlush(true).login('facebook');
      var call = callback.getCall(0);
      expect(call.args[1]).eqls(auth.getUser('facebook'));
    });
  });

  describe('#createUser', function() {
    it('should have tests');
  })

  describe('#changePassword', function() {
    it('should have tests');
  })

  describe('#sendPasswordResetEmail', function() {
    it('should have tests');
  })

  describe('#createUser', function() {
    it('should have tests');
  })

  describe('#removeUser', function() {
    it('should have tests');
  })

});