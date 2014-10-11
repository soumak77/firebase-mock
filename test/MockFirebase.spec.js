'use strict';

var sinon    = require('sinon');
var _        = require('lodash');
var expect   = require('chai').use(require('sinon-chai')).expect;
var Firebase = require('../').MockFirebase;

describe('MockFirebase', function() {
  
  var fb;
  beforeEach(function() {
    fb = new Firebase().child('data');
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

    it('should remove old keys from data', function() {
      fb.set({
        alpha: true,
        bravo: false
      });
      expect(fb.getData().a).to.be.undefined;
    });

    it('should set priorities on children if included in data', function() {
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
      var data = fb.getData();
      expect(data).to.contain({
        a: 'a',
        b: 'b'
      });
      expect(fb.child('a')).to.have.property('priority', 100);
      expect(fb.child('b')).to.have.property('priority', 200);
    });

    it('should have correct priority in snapshot if added with set', function() {
      var spy = sinon.spy();
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

    it('should fire child_added events with correct prevChildName', function() {
      var spy = sinon.spy();
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

    it('should fire child_added events with correct priority', function() {
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
      var spy = sinon.spy();
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

    it('should trigger child_removed if child keys are missing', function() {
      var spy = sinon.spy();
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

    it('should change parent from null to object when child is set', function() {
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

  describe('#setPriority', function() {
    it('should trigger child_moved with correct prevChildName', function() {
      var spy = sinon.spy();
      fb.autoFlush();
      var keys = _.keys(fb.getData());
      expect(keys.length).above(1); // need 2 or more
      var firstKey = keys[0];
      var lastKey = keys.pop();
      fb.on('child_moved', spy);
      fb.child(firstKey).setPriority(250);
      expect(spy.callCount).equals(1);
      var call = spy.getCall(0);
      expect(call.args[1]).equals(lastKey);
    });

    it('should trigger a callback', function() {
      var spy = sinon.spy();
      fb.autoFlush();
      fb.setPriority(100, spy);
      expect(spy).to.have.been.called;
    });
  });

  describe('#setWithPriority', function() {
    it('should pass the priority to #setPriority', function() {
      fb.autoFlush();
      fb.setWithPriority({}, 250);
      expect(fb.setPriority).to.have.been.calledWith(250);
    });

    it('should pass the data and callback to #set', function() {
      var data = {};
      var callback = sinon.spy();
      fb.autoFlush();
      fb.setWithPriority(data, 250, callback);
      expect(fb.set).to.have.been.calledWith(data, callback);
    });
  });

  describe('#remove', function() {
    it('//todo');

    it('should call child_removed for any children');

    it('should change to null if last child is removed');
  });

  describe('#on', function() {
    it('should work when initial value is null', function() {
      var spy = sinon.spy();
      fb.on('value', spy);
      fb.flush();
      expect(spy.callCount).equals(1);
      fb.set('foo');
      fb.flush();
      expect(spy.callCount).equals(2);
    });
  });

  describe('#transaction', function() {
    it('should call the transaction function', function(done) {
      fb.transaction(function() {
        done();
      });
      fb.flush();
    });
    it('should fire the callback with a "committed" boolean and error message', function(done) {
      fb.transaction(function(currentValue) {
        currentValue.transacted = 'yes';
        return currentValue;
      }, function(error, committed, snapshot) {
        expect(error).equals(null);
        expect(committed).equals(true);
        expect(snapshot.val().transacted).equals('yes');
        done();
      });
      fb.flush();
    });
  });

  describe('#auth', function() {
    it('should allow fail auth for invalid token', function(done) {
      fb.failNext('auth', new Error('INVALID_TOKEN'));
      fb.auth('invalidToken', function(error, result) {
        expect(error.message).equals('INVALID_TOKEN');
        done();
      });
      fb.flush();
    });

    it('should allow auth for any other token and return expires at', function(done) {
      fb.auth('goodToken', function(error, result) {
        expect(error).equals(null);
        expect(result.auth !== null).equals(true);
        expect(result.expires !== null).equals(true);
        done();
      });
      fb.flush();
    });
  });
});
