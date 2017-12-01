'use strict';

var chai = require('chai');
var sinon = require('sinon');

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var _ = require('lodash');
var Firestore = require('../../').MockFirestore;

describe('MockFirestore', function () {

  var db, spy;
  beforeEach(function () {
    db = new Firestore();
    db.collection('collections').set(require('./data.json').collections);
    db.doc('doc').set(require('./data.json').doc);
    db.flush();
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

    it('sets the delay on all children', function () {
      db.child('key');
      db.autoFlush(10);
      expect(db.child('key').flushDelay).to.equal(10);
    });

    it('sets the delay on a parent', function () {
      db.child('key').autoFlush(10);
      expect(db.flushDelay).to.equal(10);
    });

    it('returns itself', function () {
      expect(db.autoFlush()).to.equal(db);
    });
  });

  describe('#failNext', function () {
    it('must be called with an Error', function () {
      expect(db.failNext.bind(db)).to.throw('"Error"');
    });
  });

  describe('#collection', function () {
    it('caches children', function () {
      expect(db.collection('collections')).to.equal(db.collection('collections'));
    });

    it('cannot call collection() on collection', function() {
      expect(function() {
        db.collection('collections').collection('123');
      }).to.throw();
    });

    it('allow calling doc() on collection', function() {
      expect(function() {
        db.collection('collections').doc('123');
      }).to.not.throw();
    });
  });

  describe('#doc', function () {
    it('caches children', function () {
      expect(db.doc('doc')).to.equal(db.doc('doc'));
    });

    it('cannot call doc() on document', function() {
      expect(function() {
        db.doc('doc').doc('123');
      }).to.throw();
    });

    it('allow calling collection() on document', function() {
      expect(function() {
        db.doc('doc').collection('123');
      }).to.not.throw();
    });
  });

  describe('#get', function () {
    it('gets value of doc', function () {
      var result = db.doc('doc').get();
      db.flush();
      expect(result).to.eventually.have.property('title').equal('title');
    });
  });

  describe('#set', function () {
    it('sets value of doc', function () {
      var doc = db.doc('doc');
      doc.set({
        title2: 'title2'
      });
      db.flush();
      var result = doc.get();
      db.flush();
      expect(result).to.eventually.have.property('title2').equal('title2');
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
      batch.delete(db.collection('collections'));
      batch.commit().then(function() {
        expect(db.collection('collections').get()).to.eventually.have.property('exists').equal(false);
        done();
      }).catch(function(error) {
        done(error);
      });
    });
  });
});
