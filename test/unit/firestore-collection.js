'use strict';

var chai = require('chai');
var sinon = require('sinon');
var Promise = require('rsvp').Promise;

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var _ = require('lodash');
var Firestore = require('../../').MockFirestore;

describe('MockFirestoreCollection', function () {

  var db, collection, spy;
  beforeEach(function () {
    db = new Firestore(null, require('./data.json'));
    collection = db.collection('collections');
    spy = sinon.spy();
  });

  describe('#flush', function () {
    it('flushes the queue and returns itself', function () {
      sinon.stub(db.queue, 'flush');
      expect(collection.flush(10)).to.equal(collection);
      expect(collection.queue.flush).to.have.been.calledWith(10);
    });
  });

  describe('#autoFlush', function () {
    it('enables autoflush with no args', function () {
      db.autoFlush();
      expect(db.flushDelay).to.equal(true);
    });

    it('can specify a flush delay', function () {
      db.autoFlush(10);
      expect(db.flushDelay).to.equal(10);
    });

    it('sets the delay on all collections and documents', function () {
      db.doc('doc');
      db.collection('collection');
      db.autoFlush(10);
      expect(db.doc('doc').flushDelay).to.equal(10);
      expect(db.collection('collection').flushDelay).to.equal(10);
    });

    it('sets the delay on a parent', function () {
      db.doc('doc').autoFlush(10);
      expect(db.flushDelay).to.equal(10);

      db.collection('collection').autoFlush(5);
      expect(db.flushDelay).to.equal(5);
    });

    it('returns itself', function () {
      expect(db.autoFlush()).to.equal(db);
    });
  });

  describe('#doc', function () {
    it('allow calling doc()', function() {
      expect(function() {
        collection.doc('doc');
      }).to.not.throw();
    });
  });

  describe('#add', function () {
    it('allow calling add()', function() {
      expect(function() {
        collection.add({
          value: 1
        });
      }).to.not.throw();
    });

    it('adds data to collection', function(done) {
      db.autoFlush();
      collection.add({
        prop: 1
      }).then(function(ref) {
        ref.get().then(function(doc) {
          expect(doc.id).to.equal(ref.id);
          expect(doc.data()).to.deep.equal({
            prop: 1
          });
          done();
        }).catch(done);
      }).catch(done);
    });
  });

  describe('#where', function () {
    it('caches children', function () {
      expect(db.doc('doc')).to.equal(db.doc('doc'));
    });

    it('allow calling where() on collection', function() {
      expect(function() {
        db.collection('docs').where('prop', '==', 123);
      }).to.not.throw();
    });

    it('allow calling where() multiple times', function() {
      expect(function() {
        db.collection('docs').where('prop', '==', 123).where('prop2', '==', 'abc');
      }).to.not.throw();
    });

    it('returns matched documents for operator "=="', function() {
      var results1 = collection.where('name', '==', 3).get();
      var results2 = collection.where('name', '==', 'a').get();
      var results3 = collection.where('name', '==', 'abc').get();
      var results4 = collection.where('name_type', '==', 'string').get();
      var results5 = collection.where('name_type', '==', 'number').get();
      var results6 = collection.where('name_type', '==', 'abc').get();
      var results7 = collection.where('value', '==', 3).get();
      db.flush();

      return Promise.all([
        expect(results1).to.eventually.have.property('size').to.equal(1),
        expect(results2).to.eventually.have.property('size').to.equal(1),
        expect(results3).to.eventually.have.property('size').to.equal(0),
        expect(results4).to.eventually.have.property('size').to.equal(3),
        expect(results5).to.eventually.have.property('size').to.equal(3),
        expect(results6).to.eventually.have.property('size').to.equal(0),
        expect(results7).to.eventually.have.property('size').to.equal(0)
      ]);
    });

    it('returns all documents when using unsupported operator', function() {
      var expected = 6;

      var results1 = collection.where('name', '>', 3).get();
      var results2 = collection.where('name', '>', 0).get();
      db.flush();

      return Promise.all([
        expect(results1).to.eventually.have.property('size').to.equal(expected),
        expect(results2).to.eventually.have.property('size').to.equal(expected)
      ]);
    });

    it('returns matched documents with multiple where calls', function() {
      var results1 = collection.where('name_type', '==', 'string').where('name', '==', 'a').get();
      var results2 = collection.where('name_type', '==', 'number').where('name', '==', 'a').get();
      var results3 = collection.where('name_type', '==', 'number').where('name', '==', 1).get();
      var results4 = collection.where('value', '==', 'string').where('name', '==', 'a').get();
      db.flush();

      return Promise.all([
        expect(results1).to.eventually.have.property('size').to.equal(1),
        expect(results2).to.eventually.have.property('size').to.equal(0),
        expect(results3).to.eventually.have.property('size').to.equal(1),
        expect(results4).to.eventually.have.property('size').to.equal(0)
      ]);
    });
  });

  describe('#orderBy', function () {
    it('allow calling orderBy() on collection', function() {
      expect(function() {
        db.collection('docs').orderBy('prop');
      }).to.not.throw();
    });

    it('allow calling orderBy() multiple times', function() {
      expect(function() {
        db.collection('docs').orderBy('prop').orderBy('prop2');
      }).to.not.throw();
    });

    it('returns documents is desired order', function(done) {
      var results1 = collection.orderBy('name').get();
      var results2 = collection.orderBy('name', 'desc').get();
      db.flush();

      Promise.all([results1, results2]).then(function(snaps) {
        var names = [];
        snaps[0].forEach(function(doc) {
          names.push(doc.data().name);
        });
        expect(names).to.deep.equal([1, 2, 3, 'a', 'b', 'c']);

        names = [];
        snaps[1].forEach(function(doc) {
          names.push(doc.data().name);
        });
        expect(names).to.deep.equal([1, 2, 3, 'c', 'b', 'a']);
        done();
      }).catch(done);
    });
  });

  describe('#limit', function () {
    it('allow calling limit() on collection', function() {
      expect(function() {
        db.collection('docs').limit(3);
      }).to.not.throw();
    });

    it('returns limited amount of documents', function() {
      var results1 = collection.limit(3).get();
      var results2 = collection.limit(1).get();
      var results3 = collection.limit(6).get();
      var results4 = collection.limit(10).get();
      db.flush();

      return Promise.all([
        expect(results1).to.eventually.have.property('size').to.equal(3),
        expect(results2).to.eventually.have.property('size').to.equal(1),
        expect(results3).to.eventually.have.property('size').to.equal(6),
        expect(results4).to.eventually.have.property('size').to.equal(6)
      ]);
    });
  });
});
