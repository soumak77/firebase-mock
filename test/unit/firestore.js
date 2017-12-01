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
  });

  describe('#doc', function () {
    it('caches children', function () {
      expect(db.doc('doc')).to.equal(db.doc('doc'));
    });
  });

  describe('#get', function () {
    it('gets value of doc', function (done) {
      var result = db.doc('doc').get();
      db.flush();
      result.then(function(doc) {
        expect(doc.data().title).to.equal('title');
        done();
      }).catch(function(error) {
        done(error);
      });
    });
  });

  describe('#set', function () {
    it('gets value of doc', function (done) {
      var doc = db.doc('doc');
      doc.set({
        title2: 'title2'
      });
      db.flush();
      var result = doc.get();
      db.flush();
      result.then(function(doc) {
        expect(doc.data().title2).to.equal('title2');
        done();
      }).catch(function(error) {
        done(error);
      });
    });
  });
});
