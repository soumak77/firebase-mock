'use strict';

var sinon    = require('sinon');
var expect   = require('chai').use(require('sinon-chai')).expect;
var Firebase = require('../../').MockFirebase;

describe('MockFirebase', function () {

  var fb, spy;
  beforeEach(function () {
    fb = new Firebase().child('data');
    fb.set(require('./data.json').data);
    fb.flush();
    spy = sinon.spy();
  });

  describe('#child', function () {

    it('requires a path', function () {
      expect(fb.child.bind(fb)).to.throw();
    });

    it('caches children', function () {
      expect(fb.child('foo')).to.equal(fb.child('foo'));
    });

    it('calls child recursively for multi-segment paths', function () {
      var child = fb.child('foo');
      sinon.spy(child, 'child');
      fb.child('foo/bar');
      expect(child.child).to.have.been.calledWith('bar');
    });

    it('can use leading slashes (#23)', function () {
      expect(fb.child('/children').currentPath).to.equal('Mock://data/children');
    });

    it('can use trailing slashes (#23)', function () {
      expect(fb.child('children/').currentPath).to.equal('Mock://data/children');
    });

  });

  describe('#set', function () {

    beforeEach(function () {
      fb.autoFlush();
    });

    it('should remove old keys from data', function () {
      fb.set({
        alpha: true,
        bravo: false
      });
      expect(fb.getData().a).to.be.undefined;
    });

    it('should set priorities on children if included in data', function () {
      fb.set({
        a: {
          '.priority': 100,
          '.value': 'a'
        },
        b: {
          '.priority': 200,
          '.value': 'b'
        }
      });
      expect(fb.getData()).to.contain({
        a: 'a',
        b: 'b'
      });
      expect(fb.child('a')).to.have.property('priority', 100);
      expect(fb.child('b')).to.have.property('priority', 200);
    });

    it('should have correct priority in snapshot if added with set', function () {
      fb.on('child_added', spy);
      var previousCallCount = spy.callCount;
      fb.set({
        alphanew: {
          '.priority': 100,
          '.value': 'a'
        }
      });
      expect(spy.callCount).to.equal(previousCallCount + 1);
      var snapshot = spy.lastCall.args[0];
      expect(snapshot.getPriority()).to.equal(100);
    });

    it('should fire child_added events with correct prevChildName', function () {
      fb = new Firebase('Empty://', null).autoFlush();
      fb.set({
        alpha: {
          '.priority': 200,
          foo: 'alpha'
        },
        bravo: {
          '.priority': 300,
          foo: 'bravo'
        },
        charlie: {
          '.priority': 100,
          foo: 'charlie'
        }
      });
      fb.on('child_added', spy);
      expect(spy.callCount).to.equal(3);
      [null, 'charlie', 'alpha'].forEach(function (previous, index) {
        expect(spy.getCall(index).args[1]).to.equal(previous);
      });
    });

    it('should fire child_added events with correct priority', function () {
      var data = {
        alpha: {
          '.priority': 200,
          foo: 'alpha'
        },
        bravo: {
          '.priority': 300,
          foo: 'bravo'
        },
        charlie: {
          '.priority': 100,
          foo: 'charlie'
        }
      };
      fb = new Firebase('Empty://', null).autoFlush();
      fb.set(data);
      fb.on('child_added', spy);
      expect(spy.callCount).to.equal(3);
      for (var i = 0; i < 3; i++) {
        var snapshot = spy.getCall(i).args[0];
        expect(snapshot.getPriority())
          .to.equal(data[snapshot.key()]['.priority']);
      }
    });

    it('should trigger child_removed if child keys are missing', function () {
      fb.on('child_removed', spy);
      var data = fb.getData();
      var keys = Object.keys(data);
      // data must have more than one record to do this test
      expect(keys).to.have.length.above(1);
      // remove one key from data and call set()
      delete data[keys[0]];
      fb.set(data);
      expect(spy).to.have.been.calledOnce;
    });

    it('should change parent from null to object when child is set', function () {
      fb.set(null);
      fb.child('newkey').set({
        foo: 'bar'
      });
      expect(fb.getData()).to.deep.equal({
        newkey: {
          foo: 'bar'
        }
      });
    });

  });

  describe('#setPriority', function () {

    beforeEach(function () {
      fb.autoFlush();
    });

    it('should trigger child_moved with correct prevChildName', function () {
      var keys = Object.keys(fb.getData());
      expect(keys).to.have.length.above(1);
      fb.on('child_moved', spy);
      fb.child(keys[0]).setPriority(250);
      expect(spy).to.have.been.calledOnce;
      expect(spy.firstCall.args[1]).to.equal(keys[keys.length - 1]);
    });

    it('should trigger a callback', function () {
      fb.setPriority(100, spy);
      expect(spy).to.have.been.called;
    });

  });

  describe('#setWithPriority', function () {

    it('should pass the priority to #setPriority', function () {
      fb.autoFlush();
      sinon.spy(fb, 'setPriority');
      fb.setWithPriority({}, 250);
      expect(fb.setPriority).to.have.been.calledWith(250);
    });

    it('should pass the data and callback to #set', function () {
      var data = {};
      var callback = sinon.spy();
      fb.autoFlush();
      sinon.spy(fb, 'set');
      fb.setWithPriority(data, 250, callback);
      expect(fb.set).to.have.been.calledWith(data, callback);
    });

  });

  describe('#update', function () {

    it('must be called with an object', function () {
      expect(fb.update).to.throw();
    });

    it('extends the data', function () {
      fb.update({
        foo: 'bar'
      });
      fb.flush();
      expect(fb.getData()).to.have.property('foo', 'bar');
    });

    it('can be called on an empty reference', function () {
      fb.set(null);
      fb.flush();
      fb.update({
        foo: 'bar'
      });
      fb.flush();
      expect(fb.getData()).to.deep.equal({
        foo: 'bar'
      });
    });

    it('can simulate an error', function () {
      var err = new Error();
      fb.failNext('update', err);
      fb.update({
        foo: 'bar'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.calledWith(err);
    });

  });

  describe('#remove', function () {

    beforeEach(function () {
      fb.autoFlush();
    });

    it('should call child_removed for children', function () {
      fb.on('child_removed', spy);
      fb.child('a').remove();
      expect(spy).to.have.been.called;
      var snapshot = spy.firstCall.args[0];
      expect(snapshot.key()).to.equal('a');
    });

    it('should change to null if all children are removed', function () {
      for (var key in fb.getData()) {
        fb.child(key).remove();
      }
      expect(fb.getData()).to.be.null;
    });

  });

  describe('#on', function () {

    it('should work when initial value is null', function () {
      fb.on('value', spy);
      fb.flush();
      expect(spy).to.have.been.calledOnce;
      fb.set('foo');
      fb.flush();
      expect(spy).to.have.been.calledTwice;
    });

    it('can take the context as the 3rd argument', function () {
      var context = {};
      fb.on('value', spy, context);
      fb.flush();
      expect(spy).to.have.been.calledOn(context);
    });

    it('can simulate an error', function () {
      var context = {};
      var err = new Error();
      var success = spy;
      var fail = sinon.spy();
      fb.failNext('on', err);
      fb.on('value', success, fail, context);
      fb.flush();
      expect(fail)
        .to.have.been.calledWith(err)
        .and.calledOn(context);
      expect(success).to.not.have.been.called;
    });

    it('can simulate an error', function () {
      var context = {};
      var err = new Error();
      var success = spy;
      var fail = sinon.spy();
      fb.failNext('on', err);
      fb.on('value', success, fail, context);
      fb.flush();
      expect(fail)
        .to.have.been.calledWith(err)
        .and.calledOn(context);
      expect(success).to.not.have.been.called;
    });

    it('is cancelled by an off call before flush', function () {
      fb.on('value', spy);
      fb.on('child_added', spy);
      fb._events.value = [];
      fb._events.child_added = [];
      fb.flush();
      expect(spy).to.not.have.been.called;
    });

  });

  describe('#transaction', function () {

    it('should call the transaction function', function () {
      fb.transaction(spy);
      fb.flush();
      expect(spy).to.have.been.called;
    });

    it('should fire the callback with a "committed" boolean and error message', function () {
      fb.transaction(function (currentValue) {
        currentValue.transacted = 'yes';
        return currentValue;
      }, function (error, committed, snapshot) {
        expect(error).to.be.null;
        expect(committed).to.be.true;
        expect(snapshot.val().transacted).to.equal('yes');
      });
      fb.flush();
    });

  });

  describe('#push', function () {

    it('can add data by auto id', function () {
      var id = fb._newAutoId();
      sinon.stub(fb, '_newAutoId').returns(id);
      fb.push({
        foo: 'bar'
      });
      fb.flush();
      expect(fb.child(id).getData()).to.deep.equal({
        foo: 'bar'
      });
    });

    it('can simulate an error', function () {
      var err = new Error();
      fb.failNext('push', err);
      fb.push({}, spy);
      fb.flush();
      expect(spy).to.have.been.calledWith(err);
    });

    it('avoids calling set when unnecessary', function () {
      var id = fb._newAutoId();
      sinon.stub(fb, '_newAutoId').returns(id);
      var set = sinon.stub(fb.child(id), 'set');
      fb.push();
      fb.push(null);
      expect(set).to.not.have.been.called;
    });

  });

  describe('#root', function () {

    it('traverses to the top of the reference', function () {
      expect(fb.child('foo/bar').root().currentPath)
        .to.equal('Mock://');
    });

  });

  describe('#auth', function () {

    it('should fail auth if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      fb.failNext('auth', new Error('INVALID_TOKEN'));
      fb.auth('invalidToken', spy);
      fb.flush();
      expect(spy).to.have.been.called;
    });

    it('should invoke callback if no failNext is set and changeAuthState is triggered', function () {
      var userData = {
        uid: 'kato'
      };
      spy = sinon.spy(function (error, authData) {
        expect(error).to.be.null;
        expect(authData).to.deep.equal(userData);
      });
      fb.auth('goodToken', spy);
      fb.changeAuthState(userData);
      fb.flush();
      expect(spy).to.have.been.called;
    });

  });

  describe('#authWithCustomToken', function () {

    it('should return error if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      fb.failNext('authWithCustomToken', new Error('INVALID_TOKEN'));
      fb.authWithCustomToken('invalidToken', spy);
      fb.flush();
      expect(spy).to.have.been.called;
    });

    it('should invoke callback if no failNext is set and changeAuthState is triggered', function () {
      var userData = {
        uid: 'kato'
      };
      spy = sinon.spy(function(error, authData) {
        expect(error).to.be.null;
        expect(authData).to.deep.equal(userData);
      });
      fb.authWithCustomToken('goodToken', spy);
      fb.changeAuthState(userData);
      fb.flush();
      expect(spy).to.have.been.called;
    });

  });

  describe('#authAnonymously', function () {

    it('should fail auth if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      fb.failNext('authAnonymously', new Error('INVALID_TOKEN'));
      fb.authAnonymously(spy);
      fb.flush();
      expect(spy).to.have.been.called;
    });

    it('should invoke callback if no failNext is set and changeAuthState is triggered', function () {
      var userData = {uid: 'anon123'
    };
      spy = sinon.spy(function (error, authData) {
        expect(error).to.be.null;
        expect(authData).to.deep.equal(userData);
      });
      fb.authAnonymously(spy);
      fb.changeAuthState(userData);
      fb.flush();
      expect(spy).to.have.been.called;
    });

  });

  //todo tie this into user accounts?
  describe('#authWithPassword', function () {
    it('should fail auth if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      fb.failNext('authWithPassword', new Error('INVALID_TOKEN'));
      fb.authWithPassword({
        email: 'kato',
        password: 'kato'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
    });

    it('should invoke callback if no failNext is set and changeAuthState is triggered', function () {
      var userData = {
        uid: 'anon123'
      };
      spy = sinon.spy(function (error, authData) {
        expect(error).to.be.null;
        expect(authData).to.deep.equal(userData);
      });
      fb.authWithPassword({
        email: 'kato',
        password: 'kato'
      }, spy);
      fb.changeAuthState(userData);
      fb.flush();
      expect(spy).to.have.been.called;
    });

  });

  describe('#authWithOAuthPopup', function () {

    it('should fail auth if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      fb.failNext('authWithOAuthPopup', new Error('INVALID_TOKEN'));
      fb.authWithOAuthPopup('facebook', spy);
      fb.flush();
      expect(spy).to.have.been.called;
    });

    it('should invoke callback if no failNext is set and changeAuthState is triggered', function () {
      var userData = {
        uid: 'anon123'
      };
      spy = sinon.spy(function (error, authData) {
        expect(error).to.be.null;
        expect(authData).to.deep.equal(userData);
      });
      fb.authWithOAuthPopup('facebook', spy);
      fb.changeAuthState(userData);
      fb.flush();
      expect(spy).to.have.been.called;
    });

  });

  describe('#authWithOAuthRedirect', function () {

    it('should fail auth if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      fb.failNext('authWithOAuthRedirect', new Error('INVALID_TOKEN'));
      fb.authWithOAuthRedirect('facebook', spy);
      fb.flush();
      expect(spy).to.have.been.called;
    });

    it('should invoke callback if no failNext is set and changeAuthState is triggered', function () {
      var userData = {
        uid: 'anon123'
      };
      spy = sinon.spy(function (error, authData) {
        expect(error).to.be.null;
        expect(authData).to.deep.equal(userData);
      });
      fb.authWithOAuthRedirect('facebook', spy);
      fb.changeAuthState(userData);
      fb.flush();
      expect(spy).to.have.been.called;
    });

  });

  describe('authWithOAuthToken', function () {

    it('should fail auth if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      fb.failNext('authWithOAuthToken', new Error('INVALID_TOKEN'));
      fb.authWithOAuthToken('twitter', 'invalid_token', spy);
      fb.flush();
      expect(spy).to.have.been.called;
    });

    it('should invoke callback if no failNext is set and changeAuthState is triggered', function () {
      var userData = {
        uid: 'anon123'
      };
      spy = sinon.spy(function (error, authData) {
        expect(error).to.be.null;
        expect(authData).to.deep.equal(userData);
      });
      fb.authWithOAuthToken('twitter', 'valid_token', spy);
      fb.changeAuthState(userData);
      fb.flush();
      expect(spy).to.have.been.called;
    });

  });

  describe('#getAuth', function () {

    it('should be null by default', function () {
      expect(fb.getAuth()).to.be.null;
    });

    it('should be set to whatever is passed into changeAuthState', function () {
      fb.changeAuthState({
        foo: 'bar'
      });
      fb.flush();
      expect(fb.getAuth()).to.deep.equal({
        foo: 'bar'
      });
    });

  });

  describe('#onAuth', function () {

    it('should be triggered when changeAuthState() modifies data', function () {
      fb.onAuth(spy);
      fb.changeAuthState({uid: 'kato'
    });
      fb.flush();
      expect(spy).to.have.been.called;
    });

    it('should return same value as getAuth()', function () {
      fb.onAuth(spy);
      fb.changeAuthState({uid: 'kato'
    });
      fb.flush();
      expect(spy.args[0][0]).to.deep.equal(fb.getAuth());
    });

    it('should not be triggered if auth state does not change', function () {
      fb.onAuth(spy);
      fb.changeAuthState({uid: 'kato'
    });
      fb.flush();
      fb.changeAuthState({uid: 'kato'
    });
      fb.flush();
      expect(spy).to.have.been.calledOnce;
    });

    it('should set context when callback triggered', function () {
      var context = {};
      fb.onAuth(spy, context);
      fb.changeAuthState({
        uid: 'kato'
      });
      fb.flush();
      expect(spy).to.have.been.calledOn(context);
    });

  });

  describe('#offAuth', function () {

    it('should not trigger callback after being called', function () {
      fb.onAuth(spy);
      fb.changeAuthState({uid: 'kato1'
    });
      fb.flush();
      expect(spy).to.have.been.calledOnce;
      fb.offAuth(spy);
      fb.changeAuthState({uid: 'kato1'
    });
      fb.flush();
      expect(spy).to.have.been.calledOnce;
    });

    it('should only remove callback that matches context', function () {
      var context1 = {};
      var context2 = {};
      fb.onAuth(spy);
      fb.onAuth(spy, context1);
      fb.onAuth(spy, context2);
      fb.changeAuthState({
        uid: 'kato1'
      });
      fb.flush();
      expect(spy).to.have.been.calledThrice;
      fb.offAuth(spy, context1);
      fb.changeAuthState({
        uid: 'kato2'
      });
      fb.flush();
      expect(spy.callCount).to.equal(5);
    });

  });

  describe('#unauth', function () {

    it('should set auth data to null', function () {
      fb.changeAuthState({
        uid: 'kato'
      });
      fb.flush();
      expect(fb.getAuth()).not.to.be.null;
      fb.unauth();
      expect(fb.getAuth()).to.be.null;
    });

    it('should trigger onAuth callback if auth data is non-null', function () {
      fb.changeAuthState({
        uid: 'kato'
      });
      fb.flush();
      fb.onAuth(spy);
      fb.unauth();
      expect(spy).to.have.been.called;
    });

    it('should not trigger onAuth callback if auth data is null', function () {
      fb.onAuth(spy);
      expect(fb.getAuth()).to.be.null;
      fb.unauth();
      expect(spy).to.not.have.been.called;
    });
    
  });

  describe('createUser', function () {

    it('should not generate error if credentials are valid', function () {
      fb.createUser({
        email: 'new1@new1.com',
        password: 'new1'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      expect(spy.firstCall.args[0]).to.be.null;
    });

    it('should assign each user a unique id', function () {
      fb.createUser({
        email: 'new1@new1.com',
        password: 'new1'
      }, spy);
      fb.createUser({
        email: 'new2@new2.com',
        password: 'new2'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.calledTwice;
      expect(spy.firstCall.args[1].uid).to.equal('simplelogin:1');
      expect(spy.secondCall.args[1].uid).to.equal('simplelogin:2');
    });

    it('should fail if credentials is not an object', function () {
      fb.createUser(29, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var args = spy.firstCall.args;
      var err = args[0];
      var user = args[1];
      expect(err.message).to.contain('must be a valid object.');
      expect(user).to.be.null;
    });

    it('should fail if email is not a string', function () {
      fb.createUser({
        email: true,
        password: 'foo'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      var user = spy.firstCall.args[1];
      expect(err.message).to.contain('must contain the key "email"');
      expect(user).to.be.null;
    });

    it('should fail if password is not a string', function () {
      fb.createUser({
        email: 'new1@new1.com',
        password: null
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      var user = spy.firstCall.args[1];
      expect(err.message).to.contain('must contain the key "password"');
      expect(user).to.be.null;
    });

    it('should fail if user already exists', function () {
      fb.createUser({
        email: 'duplicate@dup.com',
        password: 'foo'
      }, noop);
      fb.flush();
      fb.createUser({
        email: 'duplicate@dup.com',
        password: 'bar'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      var user = spy.firstCall.args[1];
      expect(err.message).to.contain('email address is already in use');
      expect(err.code).to.equal('EMAIL_TAKEN');
      expect(user).to.be.null;
    });

    it('should fail if failNext is set', function () {
      fb.failNext('createUser', {
        foo: 'bar'
      });
      fb.createUser({
        email: 'hello',
        password: 'world'
      }, spy);
      fb.flush();
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
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.changePassword({
        email: 'kato@kato.com',
        oldPassword: 'kato',
        newPassword: 'kato!'
      }, noop);
      fb.flush();
      expect(fb.getEmailUser('kato@kato.com').password).to.equal('kato!');
    });

    it('should fail if credentials is not an object', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.changePassword(29, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.contain('must be a valid object.');
    });

    it('should fail if email is not a string', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.changePassword({
        email: true,
        oldPassword: 'foo',
        newPassword: 'bar'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.contain('must contain the key "email"');
    });

    it('should fail if oldPassword is not a string', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.changePassword({
        email: 'new1@new1.com',
        oldPassword: null,
        newPassword: 'bar'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.contain('must contain the key "oldPassword"');
    });

    it('should fail if newPassword is not a string', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.changePassword({
        email: 'new1@new1.com',
        oldPassword: 'foo'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.contain('must contain the key "newPassword"');
    });

    it('should fail if failNext is set', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.failNext('changePassword', {
        foo: 'bar'
      });
      fb.changePassword({
        email: 'hello',
        oldPassword: 'foo',
        newPassword: 'bar'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var args = spy.firstCall.args;
      expect(args[0]).to.deep.equal({
        foo: 'bar'
      });
    });

    it('should fail if user does not exist', function () {
      fb.changePassword({
        email: 'hello',
        oldPassword: 'foo',
        newPassword: 'bar'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_USER');
      expect(err.message).to.equal('The specified user does not exist.');
    });

    it('should fail if password is invalid', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.changePassword({
        email: 'kato@kato.com',
        oldPassword: 'foo',
        newPassword: 'bar'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_PASSWORD');
      expect(err.message).to.equal('The specified password is incorrect.');
    });
  });

  describe('removeUser', function () {

    it('should remove the account', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.flush();
      expect(fb.getEmailUser('kato@kato.com')).to.deep.equal({uid: 'simplelogin:1', email: 'kato@kato.com',
        password: 'kato'
      });
      fb.removeUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.flush();
      expect(fb.getEmailUser('kato@kato.com')).to.be.null;
    });

    it('should fail if credentials is not an object', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.removeUser(29, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.contain('must be a valid object.');
    });

    it('should fail if email is not a string', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.removeUser({
        email: true,
        password: 'foo'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.equal('Firebase.removeUser failed: First argument must contain the key "email" with type "string"');
    });

    it('should fail if password is not a string', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.removeUser({
        email: 'new1@new1.com',
        password: null
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.equal('Firebase.removeUser failed: First argument must contain the key "password" with type "string"');
    });

    it('should fail if failNext is set', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.failNext('removeUser', {
        foo: 'bar'
      });
      fb.removeUser({
        email: 'hello',
        password: 'foo'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var args = spy.firstCall.args;
      expect(args[0]).to.deep.equal({
        foo: 'bar'
      });
    });

    it('should fail if user does not exist', function () {
      fb.removeUser({
        email: 'hello',
        password: 'foo'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_USER');
      expect(err.message).to.equal('The specified user does not exist.');
    });

    it('should fail if password is invalid', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.removeUser({
        email: 'kato@kato.com',
        password: 'foo'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_PASSWORD');
      expect(err.message).to.equal('The specified password is incorrect.');
    });
  });

  describe('resetPassword', function () {

    it('should simulate reset if credentials are valid', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.resetPassword({
        email: 'kato@kato.com'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      expect(spy.firstCall.args[0]).to.be.null;
    });

    it('should fail if credentials is not an object', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.resetPassword(29, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.equal('Firebase.resetPassword failed: First argument must be a valid object.');
    });

    it('should fail if email is not a string', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.resetPassword({
        email: true}, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.message).to.equal('Firebase.resetPassword failed: First argument must contain the key "email" with type "string"');
    });

    it('should fail if failNext is set', function () {
      fb.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      fb.failNext('resetPassword', {
        foo: 'bar'
      });
      fb.resetPassword({
        email: 'kato@kato.com',
        password: 'foo'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var args = spy.firstCall.args;
      expect(args[0]).to.deep.equal({
        foo: 'bar'
      });
    });

    it('should fail if user does not exist', function () {
      fb.resetPassword({
        email: 'hello'
      }, spy);
      fb.flush();
      expect(spy).to.have.been.called;
      var err = spy.firstCall.args[0];
      expect(err.code).to.equal('INVALID_USER');
      expect(err.message).to.equal('The specified user does not exist.');
    });

  });

  function noop () {}
});