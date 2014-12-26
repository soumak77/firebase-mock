'use strict';

var sinon    = require('sinon');
var expect   = require('chai').use(require('sinon-chai')).expect;
var _        = require('lodash');
var Firebase = require('../../').MockFirebase;

describe('Auth', function () {

  var ref, spy;
  beforeEach(function () {
    ref = new Firebase().child('data');
    spy = sinon.spy();
  });

  describe('#changeAuthState', function () {

    it('sets the auth data', function () {
      var user = {};
      ref.changeAuthState(user);
      ref.flush();
      expect(ref.getAuth()).to.equal(user);
    });

    it('is a noop if deeply equal', function () {
      var user = {};
      ref.changeAuthState(user);
      ref.flush();
      ref.changeAuthState({});
      expect(ref.getAuth()).to.equal(user);
    });

    it('is a noop if deeply equal', function () {
      var user = {};
      ref.changeAuthState(user);
      ref.flush();
      ref.changeAuthState({});
      expect(ref.getAuth()).to.equal(user);
    });

    it('sets null for a non object', function () {
      ref.changeAuthState({});
      ref.flush();
      ref.changeAuthState('auth');
      ref.flush();
      expect(ref.getAuth()).to.be.null;
    });

    it('triggers an auth event', function () {
      var user = {
        uid: 'ben'
      };
      ref.changeAuthState(user);
      ref.onAuth(spy);
      ref.flush();
      expect(spy.firstCall.args[0]).to.not.equal(user);
      expect(spy.firstCall.args[0]).to.deep.equal(user);
    });

  });

  describe('#getEmailUser', function () {

    it('gets a copy of the user by email', function () {
      var user = {
        uid: 'bd'
      };
      ref._auth.users['ben@example.com'] = user;
      expect(ref.getEmailUser('ben@example.com')).to.deep.equal(user);
    });

    it('only searches own properties', function () {
      expect(ref.getEmailUser('toString')).to.be.null;
    });

  });

  describe('#auth', function () {

    it('calls callback on auth state change', function () {
      var userData = {
        uid: 'kato'
      };
      spy = sinon.spy(function (error, authData) {
        expect(error).to.be.null;
        expect(authData).to.deep.equal(userData);
      });
      ref.auth('goodToken', spy);
      ref.changeAuthState(userData);
      ref.flush();
      expect(spy).to.have.been.called;
    });

  });

  describe('#authWithCustomToken', function () {

    it('calls the callback with a nextErr', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      ref.failNext('authWithCustomToken', new Error('INVALID_TOKEN'));
      ref.authWithCustomToken('invalidToken', spy);
      ref.flush();
      expect(spy).to.have.been.called;
    });

    it('invokes the callback when auth state is set', function () {
      var user = {
        uid: 'kato'
      };
      spy = sinon.spy(function (error, authData) {
        expect(error).to.be.null;
        expect(authData).to.deep.equal(user);
      });
      ref.authWithCustomToken('goodToken', spy);
      ref.changeAuthState(user);
      ref.flush();
      expect(spy).to.have.been.called;
    });

    it('handles no callback', function () {
      ref.authWithCustomToken('goodToken');
    });

  });

  describe('#getAuth', function () {

    it('is null by default', function () {
      expect(ref.getAuth()).to.be.null;
    });

    it('returns the value from changeAuthState', function () {
      ref.changeAuthState({
        foo: 'bar'
      });
      ref.flush();
      expect(ref.getAuth()).to.deep.equal({
        foo: 'bar'
      });
    });

  });

  describe('#onAuth', function () {

    it('is triggered when changeAuthState modifies data', function () {
      ref.onAuth(spy);
      ref.changeAuthState({
        uid: 'kato'
      });
      ref.flush();
      expect(spy).to.have.been.calledWithMatch({
        uid: 'kato'
      });
    });

    it('is not be triggered if auth state does not change', function () {
      ref.onAuth(spy);
      ref.changeAuthState({
        uid: 'kato'
      });
      ref.flush();
      spy.reset();
      ref.changeAuthState({
        uid: 'kato'
      });
      ref.flush();
      expect(spy).to.not.have.been.called;
    });

    it('can set a context', function () {
      var context = {};
      ref.onAuth(spy, context);
      ref.changeAuthState();
      ref.flush();
      expect(spy).to.have.been.calledOn(context);
    });

  });

  describe('#offAuth', function () {

    it('removes a callback', function () {
      ref.onAuth(spy);
      ref.changeAuthState({
        uid: 'kato1'
      });
      ref.flush();
      spy.reset();
      ref.offAuth(spy);
      ref.changeAuthState({
        uid: 'kato1'
      });
      ref.flush();
      expect(spy).to.not.have.been.called;
    });

    it('only removes callback that matches the context', function () {
      var context = {};
      ref.onAuth(spy);
      ref.onAuth(spy, context);
      ref.changeAuthState({
        uid: 'kato1'
      });
      ref.flush();
      expect(spy).to.have.been.calledTwice;
      spy.reset();
      // will not match any context
      ref.offAuth(spy, {});
      ref.offAuth(spy, context);
      ref.changeAuthState({
        uid: 'kato2'
      });
      ref.flush();
      expect(spy).to.have.been.calledOnce;
    });

  });

  describe('#unauth', function () {

    it('sets auth data to null', function () {
      ref.changeAuthState({
        uid: 'kato'
      });
      ref.flush();
      expect(ref.getAuth()).to.not.be.null;
      ref.unauth();
      expect(ref.getAuth()).to.be.null;
    });

    it('triggers onAuth callback if not null', function () {
      ref.changeAuthState({
        uid: 'kato'
      });
      ref.flush();
      ref.onAuth(spy);
      ref.unauth();
      expect(spy).to.have.been.called;
    });

    it('does not trigger onAuth callback if auth data is null', function () {
      ref.onAuth(spy);
      ref.unauth();
      expect(spy).to.not.have.been.called;
    });
    
  });

  describe('createUser', function () {

    it('should not generate error if credentials are valid', function () {
      ref.createUser({
        email: 'new1@new1.com',
        password: 'new1'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      expect(spy.firstCall.args[0]).to.be.null;
    });

    it('should assign each user a unique id', function () {
      ref.createUser({
        email: 'new1@new1.com',
        password: 'new1'
      }, spy);
      ref.createUser({
        email: 'new2@new2.com',
        password: 'new2'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.calledTwice;
      expect(spy.firstCall.args[1].uid).to.equal('simplelogin:1');
      expect(spy.secondCall.args[1].uid).to.equal('simplelogin:2');
    });

    it('should fail if credentials is not an object', function () {
      ref.createUser(29, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var args = spy.firstCall.args;
      var err = args[0];
      var user = args[1];
      expect(err.message).to.contain('must be a valid object.');
      expect(user).to.be.null;
    });

    it('should fail if email is not a string', function () {
      ref.createUser({
        email: true,
        password: 'foo'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      var user = spy.firstCall.args[1];
      expect(err.message).to.contain('must contain the key "email"');
      expect(user).to.be.null;
    });

    it('should fail if password is not a string', function () {
      ref.createUser({
        email: 'new1@new1.com',
        password: null
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      var user = spy.firstCall.args[1];
      expect(err.message).to.contain('must contain the key "password"');
      expect(user).to.be.null;
    });

    it('should fail if user already exists', function () {
      ref.createUser({
        email: 'duplicate@dup.com',
        password: 'foo'
      }, _.noop);
      ref.flush();
      ref.createUser({
        email: 'duplicate@dup.com',
        password: 'bar'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      var user = spy.firstCall.args[1];
      expect(err.message).to.contain('email address is already in use');
      expect(err.code).to.equal('EMAIL_TAKEN');
      expect(user).to.be.null;
    });

    it('should fail if failNext is set', function () {
      ref.failNext('createUser', {
        foo: 'bar'
      });
      ref.createUser({
        email: 'hello',
        password: 'world'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var args = spy.firstCall.args;
      expect(args[0]).to.deep.equal({
        foo: 'bar'
      });
      expect(args[1]).to.be.null;
    });

  });

  describe('changePassword', function () {

    it('should change the password', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.changePassword({
        email: 'kato@kato.com',
        oldPassword: 'kato',
        newPassword: 'kato!'
      }, _.noop);
      ref.flush();
      expect(ref.getEmailUser('kato@kato.com').password).to.equal('kato!');
    });

    it('should fail if credentials is not an object', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.changePassword(29, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.contain('must be a valid object.');
    });

    it('should fail if email is not a string', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.changePassword({
        email: true,
        oldPassword: 'foo',
        newPassword: 'bar'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.contain('must contain the key "email"');
    });

    it('should fail if oldPassword is not a string', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.changePassword({
        email: 'new1@new1.com',
        oldPassword: null,
        newPassword: 'bar'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.contain('must contain the key "oldPassword"');
    });

    it('should fail if newPassword is not a string', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.changePassword({
        email: 'new1@new1.com',
        oldPassword: 'foo'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.contain('must contain the key "newPassword"');
    });

    it('should fail if failNext is set', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.failNext('changePassword', {
        foo: 'bar'
      });
      ref.changePassword({
        email: 'hello',
        oldPassword: 'foo',
        newPassword: 'bar'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var args = spy.firstCall.args;
      expect(args[0]).to.deep.equal({
        foo: 'bar'
      });
    });

    it('should fail if user does not exist', function () {
      ref.changePassword({
        email: 'hello',
        oldPassword: 'foo',
        newPassword: 'bar'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_USER');
      expect(err.message).to.equal('The specified user does not exist.');
    });

    it('should fail if password is invalid', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.changePassword({
        email: 'kato@kato.com',
        oldPassword: 'foo',
        newPassword: 'bar'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_PASSWORD');
      expect(err.message).to.equal('The specified password is incorrect.');
    });
  });

  describe('removeUser', function () {

    it('should remove the account', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.flush();
      expect(ref.getEmailUser('kato@kato.com')).to.deep.equal({uid: 'simplelogin:1', email: 'kato@kato.com',
        password: 'kato'
      });
      ref.removeUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.flush();
      expect(ref.getEmailUser('kato@kato.com')).to.be.null;
    });

    it('should fail if credentials is not an object', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.removeUser(29, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.contain('must be a valid object.');
    });

    it('should fail if email is not a string', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.removeUser({
        email: true,
        password: 'foo'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.equal('Firebase.removeUser failed: First argument must contain the key "email" with type "string"');
    });

    it('should fail if password is not a string', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.removeUser({
        email: 'new1@new1.com',
        password: null
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.equal('Firebase.removeUser failed: First argument must contain the key "password" with type "string"');
    });

    it('should fail if failNext is set', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.failNext('removeUser', {
        foo: 'bar'
      });
      ref.removeUser({
        email: 'hello',
        password: 'foo'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var args = spy.firstCall.args;
      expect(args[0]).to.deep.equal({
        foo: 'bar'
      });
    });

    it('should fail if user does not exist', function () {
      ref.removeUser({
        email: 'hello',
        password: 'foo'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_USER');
      expect(err.message).to.equal('The specified user does not exist.');
    });

    it('should fail if password is invalid', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.removeUser({
        email: 'kato@kato.com',
        password: 'foo'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_PASSWORD');
      expect(err.message).to.equal('The specified password is incorrect.');
    });
  });

  describe('resetPassword', function () {

    it('should simulate reset if credentials are valid', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.resetPassword({
        email: 'kato@kato.com'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      expect(spy.firstCall.args[0]).to.be.null;
    });

    it('should fail if credentials is not an object', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.resetPassword(29, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.equal('Firebase.resetPassword failed: First argument must be a valid object.');
    });

    it('should fail if email is not a string', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.resetPassword({
        email: true}, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.equal('Firebase.resetPassword failed: First argument must contain the key "email" with type "string"');
    });

    it('should fail if failNext is set', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.failNext('resetPassword', {
        foo: 'bar'
      });
      ref.resetPassword({
        email: 'kato@kato.com',
        password: 'foo'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var args = spy.firstCall.args;
      expect(args[0]).to.deep.equal({
        foo: 'bar'
      });
    });

    it('should fail if user does not exist', function () {
      ref.resetPassword({
        email: 'hello'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_USER');
      expect(err.message).to.equal('The specified user does not exist.');
    });

  });

});