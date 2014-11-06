'use strict';

var sinon    = require('sinon');
var _        = require('lodash');
var expect   = require('chai').use(require('sinon-chai')).expect;
var Firebase = require('../../').MockFirebase;

describe('MockFirebase', function () {

  var fb, spy;
  beforeEach(function () {
    fb  = new Firebase().child('data');
    spy = sinon.spy();
  });

  describe('#child', function () {

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
          .to.equal(data[snapshot.name()]['.priority']);
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

    it('should pass the priority to #setPriority', function() {
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

  describe('#remove', function () {

    beforeEach(function () {
      fb.autoFlush();
    });

    it('should call child_removed for children', function () {
      fb.on('child_removed', spy);
      fb.child('a').remove();
      expect(spy).to.have.been.called;
      var snapshot = spy.firstCall.args[0];
      expect(snapshot.name()).to.equal('a');
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

  describe('#auth', function () {

    it('should allow fail auth for invalid token', function () {
      fb.failNext('auth', new Error('INVALID_TOKEN'));
      fb.auth('invalidToken', function (error, result) {
        expect(error.message).to.equal('INVALID_TOKEN');
      });
      fb.flush();
    });

    it('should allow auth for any other token and return expires at', function () {
      fb.auth('goodToken', function (error, result) {
        expect(error).to.be.null;
        expect(result.auth).to.not.be.null;
        expect(result.expires).to.not.be.null;
      });
      fb.flush();
    });

  });

});
