'use strict';

var expect   = require('chai').use(require('sinon-chai')).expect;
var sinon    = require('sinon');
var Snapshot = require('../../src/firestore-snapshot');
var Firebase = require('../..').MockFirebase;

describe('DataSnapshot', function () {

  var ref;
  beforeEach(function () {
    ref = new Firebase();
  });

  describe('#ref', function () {

    it('returns the reference', function () {
      expect(new Snapshot(ref).ref).to.equal(ref);
    });

  });

  describe('#data', function () {

    it('returns a deep clone of the data', function () {
      var data = {
        foo: {
          bar: 'baz'
        }
      };
      var snapshot = new Snapshot(ref, data);
      expect(snapshot.data()).to.deep.equal(data);
      expect(snapshot.data()).to.not.equal(data);
      expect(snapshot.data().foo).to.not.equal(data.foo);
    });

    it('returns null for an empty object', function () {
      expect(new Snapshot(ref, {}).data()).to.equal(null);
    });

  });

  describe('#child', function () {

    it('generates a snapshot for a child ref', function () {
      var parent = new Snapshot(ref);
      var child = parent.child('key');
      expect(parent.ref.child('key')).to.equal(child.ref);
    });

    it('uses child data', function () {
      var parent = new Snapshot(ref, {key: 'val'});
      var child = parent.child('key');
      expect(child.data()).to.equal('val');
    });

    it('uses null when there is no child data', function () {
      var parent = new Snapshot(ref);
      var child = parent.child('key');
      expect(child.data()).to.equal(null);
    });

  });

  describe('#exists', function () {

    it('checks for a null value', function () {
      expect(new Snapshot(ref, null).exists).to.equal(false);
      expect(new Snapshot(ref, {foo: 'bar'}).exists).to.equal(true);
    });

  });

  describe('#forEach', function () {

    it('calls the callback with each child', function () {
      var snapshot = new Snapshot(ref, {
        foo: 'bar',
        bar: 'baz'
      });
      var callback = sinon.spy();
      snapshot.forEach(callback);
      expect(callback.firstCall.args[0].data()).to.equal('bar');
      expect(callback.secondCall.args[0].data()).to.equal('baz');
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

  });

  describe('#hasChild', function () {

    it('can handle null snapshots', function () {
      expect(new Snapshot(ref, null).hasChild('foo')).to.equal(false);
    });

    it('tests for the key', function () {
      var snapshot = new Snapshot(ref, {foo: 'bar'});
      expect(snapshot.hasChild('foo')).to.equal(true);
      expect(snapshot.hasChild('bar')).to.equal(false);
    });

  });

  describe('#hasChildren', function () {

    it('tests for children', function () {
      expect(new Snapshot(ref).hasChildren()).to.equal(false);
      expect(new Snapshot(ref, {foo: 'bar'}).hasChildren()).to.equal(true);
    });

  });

  describe('#id', function () {

    it('returns the ref id', function () {
      var parent = new Snapshot(ref);
      var child = parent.child('aChild');
      expect(new Snapshot(child).id).to.equal(child.key);
    });

  });

  describe('#numChildren', function () {

    it('returns the object size', function () {
      expect(new Snapshot(ref, {foo: 'bar'}).numChildren()).to.equal(1);
    });

    it('returns 0 for a null snapshot', function () {
      expect(new Snapshot(ref, null).numChildren()).to.equal(0);
    });

  });

});
