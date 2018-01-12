'use strict';

var expect   = require('chai').use(require('sinon-chai')).expect;
var sinon    = require('sinon');
var Snapshot = require('../../src/firestore-query-snapshot');
var Firestore = require('../../').MockFirestore;

describe('QuerySnapshot', function () {

  var db, ref;
  beforeEach(function () {
    db = new Firestore();
    ref = db.collection('123');
  });

  describe('#forEach', function () {

    it('calls the callback with each child', function () {
      var snapshot = new Snapshot(ref, [{
        foo: 'bar',
        bar: 'baz'
      },{
        foo: 'bar2',
        bar: 'baz2'
      }]);
      var callback = sinon.spy();
      snapshot.forEach(callback);
      expect(callback.firstCall.args[0].data()).to.deep.equal({ foo: 'bar', bar: 'baz' });
      expect(callback.secondCall.args[0].data()).to.deep.equal({ foo: 'bar2', bar: 'baz2' });
    });

    it('can set a this value', function () {
      var snapshot = new Snapshot(ref, {
        foo: 'bar'
      });
      var callback = sinon.spy();
      var context = {};
      snapshot.forEach(callback, context);
      expect(callback).to.always.have.been.calledOn(context);
    });

    it('passes ref for each doc', function () {
      var snapshot = new Snapshot(ref, [{
        foo: 'bar',
        bar: 'baz'
      },{
        foo: 'bar2',
        bar: 'baz2'
      }]);
      var callback = sinon.spy();
      snapshot.forEach(callback);
      expect(callback.firstCall.args[0].ref).to.deep.equal(ref.doc('0'));
      expect(callback.secondCall.args[0].ref).to.deep.equal(ref.doc('1'));
    });
  });

  describe('#empty', function () {

    it('tests for children', function () {
      expect(new Snapshot(ref).empty).to.equal(true);
      expect(new Snapshot(ref, [{foo: 'bar'}]).empty).to.equal(false);
    });

  });

  describe('#size', function () {
    it('returns the object size', function () {
      expect(new Snapshot(ref, [{foo: 'bar'}]).size).to.equal(1);
    });

    it('returns 0 for a null snapshot', function () {
      expect(new Snapshot(ref, null).size).to.equal(0);
    });
  });

  describe('#docs', function () {
    it('returns the data as an array of snapshots', function () {
      var snapshot = new Snapshot(ref, [{
        foo: 'bar',
        bar: 'baz'
      },{
        foo: 'bar2',
        bar: 'baz2'
      }]);
      var docs = snapshot.docs;
      expect(docs.length).to.equal(2);
      expect(snapshot.size).to.equal(2);
    });
  });
});
