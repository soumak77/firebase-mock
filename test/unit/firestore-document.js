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
