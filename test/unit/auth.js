'use strict';

var chai = require('chai');
var sinon = require('sinon');

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var Authentication = require('../../').MockAuthentication;
var Promise   = require('rsvp').Promise;
var User = require('../../src/user');
var _ = require('../../src/lodash');

describe('Auth', function () {

  var ref, spy;
  beforeEach(function () {
    ref = new Authentication();
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

  describe('#getUserByEmail', function () {
    beforeEach(function () {
      ref.autoFlush();
    });

    afterEach(function () {
      ref.autoFlush(false);
    });

    it('gets a copy of the user by email', function () {
      ref.createUser({
        uid: 'bd',
        email: 'ben@example.com'
      });
      var found = ref.getUserByEmail('ben@example.com');
      return Promise.all([
        expect(found).to.eventually.have.property('uid', 'bd'),
        expect(found).to.eventually.have.property('email', 'ben@example.com'),
      ]);
    });

    it('only searches own properties', function () {
      var found = ref.getUserByEmail('toString');
      return expect(found).to.be.rejected;
    });

    it('fails when user not found', function () {
      var found = ref.getUser('bd');
      return expect(found).to.be.rejected.and.notify(function(err) {
        expect(err.code).to.equal('auth/user-not-found');
      });
    });
  });

  describe('#getUser', function () {
    beforeEach(function () {
      ref.autoFlush();
    });

    afterEach(function () {
      ref.autoFlush(false);
    });

    it('gets a copy of the user by uid', function () {
      ref.createUser({
        uid: 'bd',
        email: 'ben@example.com',
        password: '123'
      });
      var found = ref.getUser('bd');
      return Promise.all([
        expect(found).to.eventually.have.property('uid', 'bd'),
        expect(found).to.eventually.have.property('email', 'ben@example.com'),
      ]);
    });

    it('only searches own properties', function () {
      var found = ref.getUser('toString');
      return expect(found).to.be.rejected;
    });

    it('fails when user not found', function () {
      var found = ref.getUser('bd');
      return expect(found).to.be.rejected.and.notify(function(err) {
        expect(err.code).to.equal('auth/user-not-found');
      });
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
        expect(error.message).to.equal('auth/invalid-credential');
        expect(result).to.equal(null);
      });
      ref.failNext('authWithCustomToken', new Error('auth/invalid-credential'));
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

    it('creates a new user without a password', function () {
      ref.createUser({
        email: 'new1@new1.com'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.calledWithMatch(null, {
        uid: 'simplelogin:1'
      });
    });

    it('creates a new user and returns promise', function (done) {
      var promise = ref.createUser({
        email: 'new1@new1.com',
        password: 'new1'
      });
      ref.flush();
      promise.then(function(user) {
        expect(user).to.have.property('uid', 'simplelogin:1');
        done();
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

    it('creates a new user with preset uid', function () {
      ref.createUser({
        email: 'new1@new1.com',
        password: 'new1',
        uid: 'uid1'
      }, spy);
      ref.flush();
      expect(spy.firstCall.args[1].uid).to.equal('uid1');
    });

    it('creates a new user with preset additional attributes', function () {
      ref.createUser({
        uid: 'uid1',
        email: 'new1@new1.com',
        password: 'new1',
        displayName: 'new user 1',
        emailVerified: true,
      }, spy);
      ref.flush();
      return Promise.all([
        expect(ref.getUser('uid1')).to.eventually.have.property('displayName', 'new user 1'),
        expect(ref.getUser('uid1')).to.eventually.have.property('emailVerified', true),
      ]);
    });

    it('fails if credentials is not an object', function () {
      expect(ref.createUser.bind(ref, 29)).to.throw('must be a valid object');
    });

    it('fails if email is not a string', function () {
      expect(ref.createUser.bind(ref, {
        email: true,
        password: 'foo'
      }))
      .to.throw('must contain the key "email"');
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
      expect(err.message).to.contain('email is already in use');
      expect(err.code).to.equal('auth/email-already-exists');
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

  describe('#createUserWithEmailAndPassword', function () {
    it('creates a new user', function () {
      var promise = ref.createUserWithEmailAndPassword('new1@new1.com', 'new1');
      ref.flush();
      return Promise.all([
        expect(promise).to.eventually.have.property('uid', 'simplelogin:1'),
        expect(promise).to.eventually.have.property('email', 'new1@new1.com')
      ]);
    });

    it('fails if failNext is set', function () {
      var err = new Error();
      ref.failNext('createUserWithEmailAndPassword', err);
      var promise = ref.createUserWithEmailAndPassword('hello', 'world');
      ref.flush();
      expect(promise).to.be.rejectedWith(err);
    });
  });

  describe('#changeEmail', function () {

    beforeEach(function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
    });

    it('changes the email', function () {
      ref.changeEmail({
        oldEmail: 'kato@kato.com',
        newEmail: 'kato@google.com',
        password: 'kato'
      }, _.noop);
      ref.flush();
      return Promise.all([
        expect(ref.getUserByEmail('kato@google.com')).to.eventually.have.property('password', 'kato'),
        expect(ref.getUserByEmail('kato@kato.com')).to.be.rejected
      ]);
    });

    it('fails if credentials is not an object', function () {
      expect(ref.changeEmail.bind(ref, 29)).to.throw('must be a valid object');
    });

    it('fails if oldEmail is not a string', function () {
      expect(ref.changeEmail.bind(ref, {
        oldEmail: true,
        newEmail: 'foo@foo.com',
        password: 'bar'
      }))
      .to.throw('must contain the key "oldEmail"');
    });

    it('should fail if newEmail is not a string', function () {
      expect(ref.changeEmail.bind(ref, {
        oldEmail: 'old@old.com',
        newEmail: null,
        password: 'bar'
      }))
      .to.throw('must contain the key "newEmail"');
    });

    it('fails if password is not a string', function () {
      expect(ref.changeEmail.bind(ref, {
        oldEmail: 'old@old.com',
        newEmail: 'new@new.com',
        password: null
      }))
      .to.throw('must contain the key "password"');
    });

    it('fails if user does not exist', function () {
      ref.changeEmail({
        oldEmail: 'hello@foo.com',
        newEmail: 'kato@google.com',
        password: 'bar'
      }, spy);
      ref.flush();
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('auth/user-not-found');
      expect(err.message).to.contain('no existing user');
    });

    it('fails if password is incorrect', function () {
      ref.changeEmail({
        oldEmail: 'kato@kato.com',
        newEmail: 'kato@google.com',
        password: 'wrong'
      }, spy);
      ref.flush();
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('auth/invalid-password');
      expect(err.message).to.contain('password user property is invalid');
    });

    it('fails if failNext is set', function () {
      var err = new Error();
      ref.failNext('changeEmail', err);
      ref.changeEmail({
        oldEmail: 'kato@kato.com',
        newEmail: 'kato@google.com',
        password: 'right'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.calledWith(err);
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
      return expect(ref.getUserByEmail('kato@kato.com')).to.eventually.have.property('password', 'kato!');
    });

    it('fails if credentials is not an object', function () {
      expect(ref.changePassword.bind(ref, 29)).to.throw('must be a valid object');
    });

    it('fails if email is not a string', function () {
      expect(ref.changePassword.bind(ref, {
        email: true,
        oldPassword: 'foo',
        newPassword: 'bar'
      }))
      .to.throw('must contain the key "email"');
    });

    it('should fail if oldPassword is not a string', function () {
      expect(ref.changePassword.bind(ref, {
        email: 'new1@new1.com',
        oldPassword: null,
        newPassword: 'bar'
      }))
      .to.throw('must contain the key "oldPassword"');
    });

    it('fails if newPassword is not a string', function () {
      expect(ref.changePassword.bind(ref, {
        email: 'new1@new1.com',
        oldPassword: 'foo'
      }))
      .to.throw('must contain the key "newPassword"');
    });

    it('fails if user does not exist', function () {
      ref.changePassword({
        email: 'hello',
        oldPassword: 'foo',
        newPassword: 'bar'
      }, spy);
      ref.flush();
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('auth/user-not-found');
      expect(err.message).to.contain('no existing user');
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
      expect(err.code).to.equal('auth/invalid-password');
      expect(err.message).to.contain('password user property is invalid');
    });

    it('fails if failNext is set', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, _.noop);
      var err = new Error();
      ref.failNext('changePassword', err);
      ref.changePassword({
        email: 'kato@kato.com',
        oldPassword: 'kato',
        newPassword: 'new'
      }, spy);
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

      return ref.getUserByEmail('kato@kato.com').then(function(user) {
        expect(user).to.have.property('uid').to.equal('simplelogin:1');
        expect(user).to.have.property('email').to.equal('kato@kato.com');
        expect(user).to.have.property('password').to.equal('kato');

        ref.removeUser({
          email: 'kato@kato.com',
          password: 'kato'
        }, _.noop);
        ref.flush();
        return expect(ref.getUserByEmail('kato@kato.com')).to.be.rejected;
      });
    });

    it('fails if credentials is not an object', function () {
      expect(ref.removeUser.bind(ref, 29)).to.throw('must be a valid object');
    });

    it('fails if email is not a string', function () {
      expect(ref.removeUser.bind(ref, {
        email: true,
        password: 'foo'
      }))
      .to.throw('must contain the key "email" with type "string"');
    });

    it('fails if password is not a string', function () {
      expect(ref.removeUser.bind(ref, {
        email: 'new1@new1.com',
        password: null
      }))
      .to.throw('must contain the key "password" with type "string"');
    });

    it('fails if user does not exist', function () {
      ref.removeUser({
        email: 'hello',
        password: 'foo'
      }, spy);
      ref.flush();
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('auth/user-not-found');
      expect(err.message).to.contain('no existing user');
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
      expect(err.code).to.equal('auth/invalid-password');
      expect(err.message).to.contain('password user property is invalid');
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
      expect(ref.resetPassword.bind(ref, 29)).to.throw('must be a valid object');
    });

    it('fails if email is not a string', function () {
      expect(ref.resetPassword.bind(ref, {
        email: true
      }))
      .to.throw('must contain the key "email" with type "string"');
    });

    it('fails if user does not exist', function () {
      ref.resetPassword({
        email: 'hello'
      }, spy);
      ref.flush();
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('auth/user-not-found');
      expect(err.message).to.contain('no existing user');
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

  describe('#verifyIdToken', function () {
    beforeEach(function () {
      ref.autoFlush();
    });

    afterEach(function () {
      ref.autoFlush(false);
    });

    it('succeeds if user exists with token', function () {
      return ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }).then(function(user) {
        return expect(ref.verifyIdToken(user._idtoken)).to.eventually.have.property('uid', user.uid);
      });
    });

    it('should populates claims', function () {
      return ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }).then(function(user) {
        return ref.setCustomUserClaims(user.uid, {
          admin: true
        }).then(function() {
          return expect(ref.verifyIdToken(user._idtoken)).to.eventually.have.property('admin', true);
        });
      });
    });

    it('fails if no user exists with token', function () {
      return expect(ref.verifyIdToken('token')).to.be.rejected;
    });

    it('fails if failNext is set', function () {
      return ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }).then(function(user) {
        var err = new Error('custom error');
        ref.failNext('verifyIdToken', err);
        return expect(ref.verifyIdToken(user._idtoken)).to.be.rejectedWith(Error, 'custom error');
      });
    });

  });

  describe('#setCustomUserClaims', function () {
    beforeEach(function () {
      ref.autoFlush();
    });

    afterEach(function () {
      ref.autoFlush(false);
    });

    it('succeeds if user exists', function () {
      return ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }).then(function(user) {
        return ref.setCustomUserClaims(user.uid, {
          admin: true
        }).then(function() {
          return expect(ref.getUser(user.uid)).to.eventually.have.property('customClaims').to.have.property('admin', true);
        });
      });
    });

    it('fails if no user exists with token', function () {
      return expect(ref.setCustomUserClaims('uid', {
        admin: true
      })).to.be.rejected;
    });

    it('fails if failNext is set', function () {
      return ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }).then(function(user) {
        var err = new Error('custom error');
        ref.failNext('setCustomUserClaims', err);
        return expect(ref.setCustomUserClaims('uid', {
          admin: true
        })).to.be.rejectedWith(Error, 'custom error');
      });
    });

  });

});
