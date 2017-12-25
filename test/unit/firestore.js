'use strict';

var chai = require('chai');
var sinon = require('sinon');
var Promise = require('rsvp').Promise;

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var _ = require('lodash');
var Firestore = require('../../').MockFirestore;

describe('MockFirestore', function () {

  var db, spy;
  beforeEach(function () {
    db = new Firestore();
    spy = sinon.spy();
  });

  describe('FieldValue', function () {
    it('delete', function () {
      expect(Firestore.FieldValue.delete()).to.equal(null);
    });
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

    it('sets the delay on all collections and documents', function () {
      db.doc('doc');
      db.collection('collection');
      db.autoFlush(10);
      expect(db.doc('doc').flushDelay).to.equal(10);
      expect(db.collection('collection').flushDelay).to.equal(10);
    });

    it('returns itself', function () {
      expect(db.autoFlush()).to.equal(db);
    });
  });

  describe('#collection', function () {
    it('allow calling collection()', function() {
      expect(function() {
        db.collection('collections');
      }).to.not.throw();
    });

    it('allow calling collection() with complex path', function() {
      expect(function() {
        db.collection('collections/doc/collections');
      }).to.not.throw();
    });

    it('caches children', function () {
      expect(db.collection('collections')).to.equal(db.collection('collections'));
    });

    it('caches deep children', function () {
      expect(db.collection('collections').doc('doc').collection('collections2')).to.equal(db.collection('collections').doc('doc').collection('collections2'));
    });

    it('caches deep children with paths', function () {
      expect(db.collection('collections/doc/collections2')).to.equal(db.collection('collections').doc('doc').collection('collections2'));
    });
  });

  describe('#doc', function () {
    it('allow calling doc()', function() {
      expect(function() {
        db.doc('doc');
      }).to.not.throw();
    });

    it('allow calling doc() with complex path', function() {
      expect(function() {
        db.doc('doc/collections/doc');
      }).to.not.throw();
    });

    it('caches children', function () {
      expect(db.doc('doc')).to.equal(db.doc('doc'));
    });

    it('caches deep children', function () {
      expect(db.doc('doc').collection('collections').doc('doc2')).to.equal(db.doc('doc').collection('collections').doc('doc2'));
    });

    it('caches deep children with paths', function () {
      expect(db.doc('doc/collections/doc2')).to.equal(db.doc('doc').collection('collections').doc('doc2'));
    });
  });

  describe('#batch', function () {
    it('gets value of doc', function (done) {
      var batch = db.batch();
      batch.update(db.doc('doc'), {
        name: 'abc'
      });
      batch.set(db.doc('doc2'), {
        number: '123'
      });
      batch.delete(db.collection('collections').doc('a'));
      batch.commit().then(function() {
        expect(db.collection('collections').get()).to.eventually.have.property('exists').equal(false);
        done();
      }).catch(function(error) {
        done(error);
      });
    });
  });
});
