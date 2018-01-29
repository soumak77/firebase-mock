'use strict';

var chai = require('chai');
var sinon = require('sinon');
var Promise = require('rsvp').Promise;

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var _ = require('lodash');
var Firestore = require('../../').MockFirestore;

describe('MockFirestoreDocument', function () {

  var db, doc, spy;
  beforeEach(function () {
    db = new Firestore(null, require('./data.json'));
    doc = db.doc('doc');
    spy = sinon.spy();
  });

  describe('#flush', function () {
    it('flushes the queue and returns itself', function () {
      sinon.stub(db.queue, 'flush');
      expect(db.flush(10)).to.equal(db);
      expect(db.queue.flush).to.have.been.calledWith(10);
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

    it('sets the delay on all collections', function () {
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

  describe('#collection', function () {
    it('allow calling collection()', function() {
      expect(function() {
        doc.collection('collection');
      }).to.not.throw();
    });
  });

  describe('#get', function () {
    it('gets value of doc', function (done) {
      db.doc('doc').get().then(function(snap) {
        expect(snap.get('title')).to.equal('title');
        done();
      }).catch(done);

      db.flush();
    });

    it('results contain ref for doc', function () {
      var ref = db.doc('doc');

      expect(ref.get()).to.eventually.have.property('ref').equal(ref);
    });
  });

  describe('#set', function () {
    it('sets value of doc', function (done) {
      doc.set({
        title: 'title2'
      });
      doc.get().then(function(snap) {
        expect(snap.get('title')).to.equal('title2');
        done();
      }).catch(done);

      db.flush();
    });
  });

  describe('#set with {merge: true}', function () {
    it('updates value of doc', function (done) {
      doc.set({
        title: 'title2',
        nested: {
          prop1: 'prop1'
        }
      });
      doc.set({
        nested: {
          prop2: 'prop2'
        }
      }, { merge: true });

      doc.get().then(function (snap) {
        expect(snap.get('title')).to.equal('title2');
        expect(snap.get('nested')).to.deep.equal({ prop1: 'prop1', prop2: 'prop2' });
        done();
      }).catch(done);

      db.flush();
    });
    it('can update date fields', function (done) {
      var date = new Date(2018, 2, 2);
      var nextDate = new Date(2018, 3, 3);
      doc.set({
        date: date
      });
      doc.set({
        date: nextDate
      }, { merge: true });

      doc.get().then(function (snap) {
        expect(snap.get('date').getTime()).to.equal(nextDate.getTime());
        done();
      }).catch(done);

      db.flush();
    });
  });

  describe('#update', function () {
    it('updates value of doc', function (done) {
      doc.set({
        title: 'title2'
      });
      doc.update({
        nextTitle: 'nextTitle'
      });

      doc.get().then(function (snap) {
        expect(snap.get('title')).to.equal('title2');
        expect(snap.get('nextTitle')).to.equal('nextTitle');
        done();
      }).catch(done);

      db.flush();
    });
    it('does not merge nested properties recursively', function (done) {
      doc.set({
        nested: {
          prop1: 'prop1'
        }
      });
      doc.update({
        nested: {
          prop2: 'prop2'
        }
      });

      doc.get().then(function (snap) {
        expect(snap.get('nested')).to.deep.equal({ prop2: 'prop2' });
        done();
      }).catch(done);

      db.flush();
    });
    it('can update date fields', function (done) {
      var date = new Date(2018, 2, 2);
      var nextDate = new Date(2018, 3, 3);
      doc.set({
        date: date
      });
      doc.update({
        date: nextDate
      });

      doc.get()
        .then(function (snap) {
          expect(snap.get('date').getTime()).to.equal(nextDate.getTime());
          done();
        })
        .catch(done);

      db.flush();
    });
  });

  describe('#delete', function () {
    it('delete doc', function () {
      var result;
      var doc = db.doc('doc');
      doc.set({
        title2: 'title2'
      });
      db.flush();
      result = doc.get();
      db.flush();
      expect(result).to.eventually.have.property('title2').equal('title2');
      doc.delete();
      db.flush();
      result = doc.get();
      db.flush();
      expect(result).to.eventually.equal(null);
    });
  });
});
