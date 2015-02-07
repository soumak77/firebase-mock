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
      expect(ref.getAuth()).to.equal(null);
    });

    it('triggers an auth event', function () {
      var user = {
        uid: 'ben'
      };
      ref.changeAuthState(user);
      ref.onAuth(spy);
      spy.reset();
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
      expect(ref.getEmailUser('toString')).to.equal(null);
    });

  });

  describe('#auth', function () {

    it('calls callback on auth state change', function () {
      var userData = {
        uid: 'kato'
      };
      spy = sinon.spy(function (error, authData) {
        expect(error).to.equal(null);
        expect(authData).to.deep.equal(userData);
      });
      ref.auth('goodToken', spy);
      ref.changeAuthState(userData);
      ref.flush();
      expect(spy.called).to.equal(true);
    });

  });

  describe('#authWithCustomToken', function () {

    it('calls the callback with a nextErr', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.equal(null);
      });
      ref.failNext('authWithCustomToken', new Error('INVALID_TOKEN'));
      ref.authWithCustomToken('invalidToken', spy);
      ref.flush();
      expect(spy.called).to.equal(true);
    });

    it('invokes the callback when auth state is set', function () {
      var user = {
        uid: 'kato'
      };
      spy = sinon.spy(function (error, authData) {
        expect(error).to.equal(null);
        expect(authData).to.deep.equal(user);
      });
      ref.authWithCustomToken('goodToken', spy);
      ref.changeAuthState(user);
      ref.flush();
      expect(spy.called).to.equal(true);
    });

    it('handles no callback', function () {
      ref.authWithCustomToken('goodToken');
    });

  });

  describe('#getAuth', function () {

    it('is null by default', function () {
      expect(ref.getAuth()).to.equal(null);
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
      expect(spy.called).to.equal(false);
    });

    it('can set a context', function () {
      var context = {};
      ref.onAuth(spy, context);
      ref.changeAuthState();
      ref.flush();
      expect(spy).to.have.been.calledOn(context);
    });

    it('synchronously triggers the callback with the current auth data', function () {
      ref.onAuth(spy);
      expect(spy).to.have.been.calledWith(null);
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
      expect(spy.called).to.equal(false);
    });

    it('only removes callback that matches the context', function () {
      var context = {};
      ref.onAuth(spy);
      ref.onAuth(spy, context);
      ref.changeAuthState({
        uid: 'kato1'
      });
      ref.flush();
      expect(spy.callCount).to.equal(4);
      spy.reset();
      // will not match any context
      ref.offAuth(spy, {});
      ref.offAuth(spy, context);
      ref.changeAuthState({
        uid: 'kato2'
      });
      ref.flush();
      expect(spy.callCount).to.equal(1);
    });

  });

  describe('#unauth', function () {

    it('sets auth data to null', function () {
      ref.changeAuthState({
        uid: 'kato'
      });
      ref.flush();
      expect(ref.getAuth()).not.not.equal(null);
      ref.unauth();
      expect(ref.getAuth()).to.equal(null);
    });

    it('triggers onAuth callback if not null', function () {
      ref.changeAuthState({
        uid: 'kato'
      });
      ref.flush();
      ref.onAuth(spy);
      ref.unauth();
      expect(spy).to.have.been.calledWith(null);
    });

    it('does not trigger auth events if not authenticated', function () {
      ref.onAuth(spy);
      spy.reset();
      ref.unauth();
      expect(spy.callCount).to.equal(0);
    });

  });

  describe('#createUser', function () {

    it('creates a new user', function () {
      ref.createUser({
        email: 'new1@new1.com',
        password: 'new1'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.calledWithMatch(null, {
        uid: 'simplelogin:1'
      });
    });

    it('increments the id for each user', function () {
      ref.createUser({
        email: 'new1@new1.com',
        password: 'new1'
      }, spy);
      ref.createUser({
        email: 'new2@new2.com',
        password: 'new2'
      }, spy);
      ref.flush();
      expect(spy.firstCall.args[1].uid).to.equal('simplelogin:1');
      expect(spy.secondCall.args[1].uid).to.equal('simplelogin:2');
    });

    it('fails if credentials is not an object', function () {
      ref.createUser(29, spy);
      ref.flush();
      expect(spy.firstCall.args[0].message).to.contain('must be a valid object.');
    });

    it('fails if email is not a string', function () {
      ref.createUser({
        email: true,
        password: 'foo'
      }, spy);
      ref.flush();
      expect(spy.firstCall.args[0].message).to.contain('must contain the key "email"');
    });

    it('fails if password is not a string', function () {
      ref.createUser({
        email: 'new1@new1.com',
        password: null
      }, spy);
      ref.flush();
      expect(spy.firstCall.args[0].message).to.contain('must contain the key "password"');
    });

    it('fails if user already exists', function () {
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
      var err = spy.firstCall.args[0];
      expect(err.message).to.contain('email address is already in use');
      expect(err.code).to.equal('EMAIL_TAKEN');
    });

    it('fails if failNext is set', function () {
      var err = new Error();
      ref.failNext('createUser', err);
      ref.createUser({
        email: 'hello',
        password: 'world'
      }, spy);
      ref.flush();
      expect(spy.firstCall.args[0]).to.equal(err);
    });

  });

  describe('#changePassword', function () {

    it('changes the password', function () {
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
      expect(ref.getEmailUser('kato@kato.com'))
        .to.have.property('password', 'kato!');
    });

    it('fails if credentials is not an object', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.changePassword(29, spy);
      ref.flush();
      expect(spy.called).to.equal(true);
      expect(spy.firstCall.args[0].message).to.contain('must be a valid object');
    });

    it('fails if email is not a string', function () {
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
      expect(spy.firstCall.args[0].message).to.contain('must contain the key "email"');
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
      expect(spy.firstCall.args[0].message).to.contain('must contain the key "oldPassword"');
    });

    it('fails if newPassword is not a string', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.changePassword({
        email: 'new1@new1.com',
        oldPassword: 'foo'
      }, spy);
      ref.flush();
      expect(spy.firstCall.args[0].message).to.contain('must contain the key "newPassword"');
    });

    it('fails if user does not exist', function () {
      ref.changePassword({
        email: 'hello',
        oldPassword: 'foo',
        newPassword: 'bar'
      }, spy);
      ref.flush();
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_USER');
      expect(err.message).to.contain('user does not exist');
    });

    it('fails if oldPassword is incorrect', function () {
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
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_PASSWORD');
      expect(err.message).to.contain('password is incorrect');
    });

    it('fails if failNext is set', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      var err = new Error();
      ref.failNext('changePassword', err);
      ref.changePassword(null, spy);
      ref.flush();
      expect(spy).to.have.been.calledWith(err);
    });

  });

  describe('#removeUser', function () {

    it('removes the account', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.flush();
      expect(ref.getEmailUser('kato@kato.com')).to.deep.equal({
        uid: 'simplelogin:1',
        email: 'kato@kato.com',
        password: 'kato'
      });
      ref.removeUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.flush();
      expect(ref.getEmailUser('kato@kato.com')).to.equal(null);
    });

    it('fails if credentials is not an object', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.removeUser(29, spy);
      ref.flush();
      expect(spy.firstCall.args[0].message).to.contain('must be a valid object');
    });

    it('fails if email is not a string', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.removeUser({
        email: true,
        password: 'foo'
      }, spy);
      ref.flush();
      expect(spy.firstCall.args[0].message).to.contain('must contain the key "email" with type "string"');
    });

    it('fails if password is not a string', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.removeUser({
        email: 'new1@new1.com',
        password: null
      }, spy);
      ref.flush();
      expect(spy.firstCall.args[0].message).to.contain('must contain the key "password" with type "string"');
    });

    it('fails if user does not exist', function () {
      ref.removeUser({
        email: 'hello',
        password: 'foo'
      }, spy);
      ref.flush();
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_USER');
      expect(err.message).to.contain('user does not exist');
    });

    it('fails if password is incorrect', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.removeUser({
        email: 'kato@kato.com',
        password: 'foo'
      }, spy);
      ref.flush();
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_PASSWORD');
      expect(err.message).to.contain('password is incorrect');
    });

    it('fails if failNext is set', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      var err = new Error();
      ref.failNext('removeUser', err);
      ref.removeUser({
        email: 'hello',
        password: 'foo'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.calledWith(err);
    });

  });

  describe('#resetPassword', function () {

    it('simulates reset if credentials are valid', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.resetPassword({
        email: 'kato@kato.com'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.calledWith(null);
    });

    it('fails if credentials is not an object', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.resetPassword(29, spy);
      ref.flush();
      expect(spy.firstCall.args[0].message).to.contain('must be a valid object');
    });

    it('fails if email is not a string', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      ref.resetPassword({
        email: true
      }, spy);
      ref.flush();
      expect(spy.firstCall.args[0].message).to.contain('must contain the key "email" with type "string"');
    });

    it('fails if user does not exist', function () {
      ref.resetPassword({
        email: 'hello'
      }, spy);
      ref.flush();
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_USER');
      expect(err.message).to.contain('user does not exist');
    });

    it('fails if failNext is set', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      var err = new Error();
      ref.failNext('resetPassword', err);
      ref.resetPassword({
        email: 'kato@kato.com',
        password: 'foo'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.calledWith(err);
    });

  });

});
