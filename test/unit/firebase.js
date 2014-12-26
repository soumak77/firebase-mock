'use strict';

var sinon    = require('sinon');
var expect   = require('chai').use(require('sinon-chai')).expect;
var Firebase = require('../../').MockFirebase;

describe('MockFirebase', function () {

  var ref, spy;
  beforeEach(function () {
    ref = new Firebase().child('data');
    ref.set(require('./data.json').data);
    ref.flush();
    spy = sinon.spy();
  });

  describe('#child', function () {

    it('requires a path', function () {
      expect(ref.child.bind(ref)).to.throw();
    });

    it('caches children', function () {
      expect(ref.child('foo')).to.equal(ref.child('foo'));
    });

    it('calls child recursively for multi-segment paths', function () {
      var child = ref.child('foo');
      sinon.spy(child, 'child');
      ref.child('foo/bar');
      expect(child.child).to.have.been.calledWith('bar');
    });

    it('can use leading slashes (#23)', function () {
      expect(ref.child('/children').currentPath).to.equal('Mock://data/children');
    });

    it('can use trailing slashes (#23)', function () {
      expect(ref.child('children/').currentPath).to.equal('Mock://data/children');
    });

  });

  describe('#set', function () {

    beforeEach(function () {
      ref.autoFlush();
    });

    it('should remove old keys from data', function () {
      ref.set({
        alpha: true,
        bravo: false
      });
      expect(ref.getData().a).to.be.undefined;
    });

    it('should set priorities on children if included in data', function () {
      ref.set({
        a: {
          '.priority': 100,
          '.value': 'a'
        },
        b: {
          '.priority': 200,
          '.value': 'b'
        }
      });
      expect(ref.getData()).to.contain({
        a: 'a',
        b: 'b'
      });
      expect(ref.child('a')).to.have.property('priority', 100);
      expect(ref.child('b')).to.have.property('priority', 200);
    });

    it('should have correct priority in snapshot if added with set', function () {
      ref.on('child_added', spy);
      var previousCallCount = spy.callCount;
      ref.set({
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
      ref = new Firebase('Empty://', null).autoFlush();
      ref.set({
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
      ref.on('child_added', spy);
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
      ref = new Firebase('Empty://', null).autoFlush();
      ref.set(data);
      ref.on('child_added', spy);
      expect(spy.callCount).to.equal(3);
      for (var i = 0; i < 3; i++) {
        var snapshot = spy.getCall(i).args[0];
        expect(snapshot.getPriority())
          .to.equal(data[snapshot.key()]['.priority']);
      }
    });

    it('should trigger child_removed if child keys are missing', function () {
      ref.on('child_removed', spy);
      var data = ref.getData();
      var keys = Object.keys(data);
      // data must have more than one record to do this test
      expect(keys).to.have.length.above(1);
      // remove one key from data and call set()
      delete data[keys[0]];
      ref.set(data);
      expect(spy).to.have.been.calledOnce;
    });

    it('should change parent from null to object when child is set', function () {
      ref.set(null);
      ref.child('newkey').set({
        foo: 'bar'
      });
      expect(ref.getData()).to.deep.equal({
        newkey: {
          foo: 'bar'
        }
      });
    });

  });

  describe('#setPriority', function () {

    beforeEach(function () {
      ref.autoFlush();
    });

    it('should trigger child_moved with correct prevChildName', function () {
      var keys = Object.keys(ref.getData());
      expect(keys).to.have.length.above(1);
      ref.on('child_moved', spy);
      ref.child(keys[0]).setPriority(250);
      expect(spy).to.have.been.calledOnce;
      expect(spy.firstCall.args[1]).to.equal(keys[keys.length - 1]);
    });

    it('should trigger a callback', function () {
      ref.setPriority(100, spy);
      expect(spy).to.have.been.called;
    });

  });

  describe('#setWithPriority', function () {

    it('should pass the priority to #setPriority', function () {
      ref.autoFlush();
      sinon.spy(ref, 'setPriority');
      ref.setWithPriority({}, 250);
      expect(ref.setPriority).to.have.been.calledWith(250);
    });

    it('should pass the data and callback to #set', function () {
      var data = {};
      var callback = sinon.spy();
      ref.autoFlush();
      sinon.spy(ref, 'set');
      ref.setWithPriority(data, 250, callback);
      expect(ref.set).to.have.been.calledWith(data, callback);
    });

  });

  describe('#update', function () {

    it('must be called with an object', function () {
      expect(ref.update).to.throw();
    });

    it('extends the data', function () {
      ref.update({
        foo: 'bar'
      });
      ref.flush();
      expect(ref.getData()).to.have.property('foo', 'bar');
    });

    it('can be called on an empty reference', function () {
      ref.set(null);
      ref.flush();
      ref.update({
        foo: 'bar'
      });
      ref.flush();
      expect(ref.getData()).to.deep.equal({
        foo: 'bar'
      });
    });

    it('can simulate an error', function () {
      var err = new Error();
      ref.failNext('update', err);
      ref.update({
        foo: 'bar'
      }, spy);
      ref.flush();
      expect(spy).to.have.been.calledWith(err);
    });

  });

  describe('#remove', function () {

    beforeEach(function () {
      ref.autoFlush();
    });

    it('should call child_removed for children', function () {
      ref.on('child_removed', spy);
      ref.child('a').remove();
      expect(spy).to.have.been.called;
      var snapshot = spy.firstCall.args[0];
      expect(snapshot.key()).to.equal('a');
    });

    it('should change to null if all children are removed', function () {
      for (var key in ref.getData()) {
        ref.child(key).remove();
      }
      expect(ref.getData()).to.be.null;
    });

  });

  describe('#on', function () {

    it('should work when initial value is null', function () {
      ref.on('value', spy);
      ref.flush();
      expect(spy).to.have.been.calledOnce;
      ref.set('foo');
      ref.flush();
      expect(spy).to.have.been.calledTwice;
    });

    it('can take the context as the 3rd argument', function () {
      var context = {};
      ref.on('value', spy, context);
      ref.flush();
      expect(spy).to.have.been.calledOn(context);
    });

    it('can simulate an error', function () {
      var context = {};
      var err = new Error();
      var success = spy;
      var fail = sinon.spy();
      ref.failNext('on', err);
      ref.on('value', success, fail, context);
      ref.flush();
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
      ref.failNext('on', err);
      ref.on('value', success, fail, context);
      ref.flush();
      expect(fail)
        .to.have.been.calledWith(err)
        .and.calledOn(context);
      expect(success).to.not.have.been.called;
    });

    it('is cancelled by an off call before flush', function () {
      ref.on('value', spy);
      ref.on('child_added', spy);
      ref._events.value = [];
      ref._events.child_added = [];
      ref.flush();
      expect(spy).to.not.have.been.called;
    });

  });

  describe('#transaction', function () {

    it('should call the transaction function', function () {
      ref.transaction(spy);
      ref.flush();
      expect(spy).to.have.been.called;
    });

    it('should fire the callback with a "committed" boolean and error message', function () {
      ref.transaction(function (currentValue) {
        currentValue.transacted = 'yes';
        return currentValue;
      }, function (error, committed, snapshot) {
        expect(error).to.be.null;
        expect(committed).to.be.true;
        expect(snapshot.val().transacted).to.equal('yes');
      });
      ref.flush();
    });

  });

  describe('#push', function () {

    it('can add data by auto id', function () {
      var id = ref._newAutoId();
      sinon.stub(ref, '_newAutoId').returns(id);
      ref.push({
        foo: 'bar'
      });
      ref.flush();
      expect(ref.child(id).getData()).to.deep.equal({
        foo: 'bar'
      });
    });

    it('can simulate an error', function () {
      var err = new Error();
      ref.failNext('push', err);
      ref.push({}, spy);
      ref.flush();
      expect(spy).to.have.been.calledWith(err);
    });

    it('avoids calling set when unnecessary', function () {
      var id = ref._newAutoId();
      sinon.stub(ref, '_newAutoId').returns(id);
      var set = sinon.stub(ref.child(id), 'set');
      ref.push();
      ref.push(null);
      expect(set).to.not.have.been.called;
    });

  });

  describe('#root', function () {

    it('traverses to the top of the reference', function () {
      expect(ref.child('foo/bar').root().currentPath)
        .to.equal('Mock://');
    });

  });

  describe('#changeAuthState', function () {

    it('sets the auth data to null if a non-object is passed', function () {
      ref.changeAuthState({});
      ref.flush();
      ref.changeAuthState('auth');
      ref.flush();
      expect(ref.getAuth()).to.be.null;
    });

  });

  describe('#auth', function () {

    it('should fail auth if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      ref.failNext('auth', new Error('INVALID_TOKEN'));
      ref.auth('invalidToken', spy);
      ref.flush();
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
      ref.auth('goodToken', spy);
      ref.changeAuthState(userData);
      ref.flush();
      expect(spy).to.have.been.called;
    });

  });

  describe('#authWithCustomToken', function () {

    it('should return error if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      ref.failNext('authWithCustomToken', new Error('INVALID_TOKEN'));
      ref.authWithCustomToken('invalidToken', spy);
      ref.flush();
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
      ref.authWithCustomToken('goodToken', spy);
      ref.changeAuthState(userData);
      ref.flush();
      expect(spy).to.have.been.called;
    });

    it('handles no callback', function () {
      ref.authWithCustomToken('goodToken');
    });

  });

  describe('#authAnonymously', function () {

    it('should fail auth if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      ref.failNext('authAnonymously', new Error('INVALID_TOKEN'));
      ref.authAnonymously(spy);
      ref.flush();
      expect(spy).to.have.been.called;
    });

    it('should invoke callback if no failNext is set and changeAuthState is triggered', function () {
      var userData = {uid: 'anon123'
    };
      spy = sinon.spy(function (error, authData) {
        expect(error).to.be.null;
        expect(authData).to.deep.equal(userData);
      });
      ref.authAnonymously(spy);
      ref.changeAuthState(userData);
      ref.flush();
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
      ref.failNext('authWithPassword', new Error('INVALID_TOKEN'));
      ref.authWithPassword({
        email: 'kato',
        password: 'kato'
      }, spy);
      ref.flush();
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
      ref.authWithPassword({
        email: 'kato',
        password: 'kato'
      }, spy);
      ref.changeAuthState(userData);
      ref.flush();
      expect(spy).to.have.been.called;
    });

  });

  describe('#authWithOAuthPopup', function () {

    it('should fail auth if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      ref.failNext('authWithOAuthPopup', new Error('INVALID_TOKEN'));
      ref.authWithOAuthPopup('facebook', spy);
      ref.flush();
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
      ref.authWithOAuthPopup('facebook', spy);
      ref.changeAuthState(userData);
      ref.flush();
      expect(spy).to.have.been.called;
    });

  });

  describe('#authWithOAuthRedirect', function () {

    it('should fail auth if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      ref.failNext('authWithOAuthRedirect', new Error('INVALID_TOKEN'));
      ref.authWithOAuthRedirect('facebook', spy);
      ref.flush();
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
      ref.authWithOAuthRedirect('facebook', spy);
      ref.changeAuthState(userData);
      ref.flush();
      expect(spy).to.have.been.called;
    });

  });

  describe('authWithOAuthToken', function () {

    it('should fail auth if failNext is set', function () {
      spy = sinon.spy(function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
        expect(result).to.be.null;
      });
      ref.failNext('authWithOAuthToken', new Error('INVALID_TOKEN'));
      ref.authWithOAuthToken('twitter', 'invalid_token', spy);
      ref.flush();
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
      ref.authWithOAuthToken('twitter', 'valid_token', spy);
      ref.changeAuthState(userData);
      ref.flush();
      expect(spy).to.have.been.called;
    });

  });

  describe('#getAuth', function () {

    it('should be null by default', function () {
      expect(ref.getAuth()).to.be.null;
    });

    it('should be set to whatever is passed into changeAuthState', function () {
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

    it('should be triggered when changeAuthState() modifies data', function () {
      ref.onAuth(spy);
      ref.changeAuthState({uid: 'kato'
    });
      ref.flush();
      expect(spy).to.have.been.called;
    });

    it('should return same value as getAuth()', function () {
      ref.onAuth(spy);
      ref.changeAuthState({
        uid: 'kato'
      });
      ref.flush();
      expect(spy.args[0][0]).to.deep.equal(ref.getAuth());
    });

    it('should not be triggered if auth state does not change', function () {
      ref.onAuth(spy);
      ref.changeAuthState({uid: 'kato'
    });
      ref.flush();
      ref.changeAuthState({uid: 'kato'
    });
      ref.flush();
      expect(spy).to.have.been.calledOnce;
    });

    it('should set context when callback triggered', function () {
      var context = {};
      ref.onAuth(spy, context);
      ref.changeAuthState({
        uid: 'kato'
      });
      ref.flush();
      expect(spy).to.have.been.calledOn(context);
    });

  });

  describe('#offAuth', function () {

    it('should not trigger callback after being called', function () {
      ref.onAuth(spy);
      ref.changeAuthState({
        uid: 'kato1'
      });
      ref.flush();
      expect(spy).to.have.been.calledOnce;
      ref.offAuth(spy);
      ref.changeAuthState({
        uid: 'kato1'
      });
      ref.flush();
      expect(spy).to.have.been.calledOnce;
    });

    it('should only remove callback that matches context', function () {
      var context1 = {};
      var context2 = {};
      ref.onAuth(spy);
      ref.onAuth(spy, context1);
      ref.onAuth(spy, context2);
      ref.changeAuthState({
        uid: 'kato1'
      });
      ref.flush();
      expect(spy).to.have.been.calledThrice;
      // unmatched context
      ref.offAuth(spy, {});
      ref.offAuth(spy, context1);
      ref.changeAuthState({
        uid: 'kato2'
      });
      ref.flush();
      expect(spy.callCount).to.equal(5);
    });

  });

  describe('#unauth', function () {

    it('should set auth data to null', function () {
      ref.changeAuthState({
        uid: 'kato'
      });
      ref.flush();
      expect(ref.getAuth()).not.to.be.null;
      ref.unauth();
      expect(ref.getAuth()).to.be.null;
    });

    it('should trigger onAuth callback if auth data is non-null', function () {
      ref.changeAuthState({
        uid: 'kato'
      });
      ref.flush();
      ref.onAuth(spy);
      ref.unauth();
      expect(spy).to.have.been.called;
    });

    it('should not trigger onAuth callback if auth data is null', function () {
      ref.onAuth(spy);
      expect(ref.getAuth()).to.be.null;
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
      }, noop);
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
      }, noop);
      ref.changePassword({
        email: 'kato@kato.com',
        oldPassword: 'kato',
        newPassword: 'kato!'
      }, noop);
      ref.flush();
      expect(ref.getEmailUser('kato@kato.com').password).to.equal('kato!');
    });

    it('should fail if credentials is not an object', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
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
      }, noop);
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
      }, noop);
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
      }, noop);
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
      }, noop);
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
      }, noop);
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
      }, noop);
      ref.flush();
      expect(ref.getEmailUser('kato@kato.com')).to.deep.equal({uid: 'simplelogin:1', email: 'kato@kato.com',
        password: 'kato'
      });
      ref.removeUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
      ref.flush();
      expect(ref.getEmailUser('kato@kato.com')).to.be.null;
    });

    it('should fail if credentials is not an object', function () {
      ref.createUser({
        email: 'kato@kato.com',
        password: 'kato'
      }, noop);
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
      }, noop);
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
      }, noop);
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
      }, noop);
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
      }, noop);
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
      }, noop);
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
      }, noop);
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
      }, noop);
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
      }, noop);
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

  function noop () {}
});