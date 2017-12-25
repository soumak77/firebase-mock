'use strict';

var expect   = require('chai').use(require('sinon-chai')).expect;
var sinon    = require('sinon');
var Snapshot = require('../../src/firestore-query-snapshot');
var Firestore = require('../../').MockFirestore;

describe('QuerySnapshot', function () {

  var db;
  beforeEach(function () {
    db = new Firestore();
  });

  describe('#forEach', function () {

    it('calls the callback with each child', function () {
      var snapshot = new Snapshot([{
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
      var snapshot = new Snapshot({
        foo: 'bar'
      });
      var callback = sinon.spy();
      var context = {};
      snapshot.forEach(callback, context);
      expect(callback).to.always.have.been.calledOn(context);
    });

  });

  describe('#empty', function () {

    it('tests for children', function () {
      expect(new Snapshot().empty).to.equal(true);
      expect(new Snapshot([{foo: 'bar'}]).empty).to.equal(false);
    });

  });

  describe('#size', function () {
    it('returns the object size', function () {
      expect(new Snapshot([{foo: 'bar'}]).size).to.equal(1);
    });

    it('returns 0 for a null snapshot', function () {
      expect(new Snapshot(null).size).to.equal(0);
    });
  });
});
