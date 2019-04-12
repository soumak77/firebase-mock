'use strict';

var chai = require('chai');
var sinon = require('sinon');
var Promise = require('rsvp').Promise;

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var _ = require('../../src/lodash');
var Firestore = require('../../').MockFirestore;
var Firebase = require('../../').MockFirebase;

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

    it('creates child collections with a firestore property pointing at the root db', function () {
      expect(doc.collection('doc').firestore).to.equal(db);
    });

    it('creates child collections with a firestore property pointing at the firestore of the collection', function () {
      expect(doc.collection('doc').firestore).to.equal(doc.firestore);
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

  describe('#create', function () {
    it('creates a new doc', function (done) {
      Firebase.setClock(function() {
        return 1234567890123;
      });
      var createDoc = db.doc('createDoc');

      createDoc.create({prop: 'title'}).then(function (result) {
        expect(result).to.have.property('writeTime');
        expect(result.writeTime.seconds).to.equal(1234567890);
      }).catch(done);

      createDoc.get().then(function (snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.get('prop')).to.equal('title');
        done();
      }).catch(done);

      db.flush();
    });

    it('creates a new doc with null values', function (done) {
      var createDoc = db.doc('createDoc');

      createDoc.create({prop: null});

      createDoc.get().then(function (snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.get('prop')).to.equal(null);
        done();
      }).catch(done);

      db.flush();
    });

    it('creates a new doc with server time values', function (done) {
      var createDoc = db.doc('createDoc');

      createDoc.create({serverTime: Firestore.FieldValue.serverTimestamp()});

      createDoc.get().then(function (snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.get('serverTime')).to.have.property('seconds');
        done();
      }).catch(done);

      db.flush();
    });

    it('throws an error when a doc already exists', function (done) {
      var createDoc = db.doc('createDoc');
      createDoc.create({prop: 'data'});
      db.flush();

      createDoc.create({otherProp: 'more data'})
        .then(function() {
          done('should have thrown an error');
        })
        .catch(function(error) {
          expect(error.code).to.equal(6);
          done();
        });

      db.flush();
    });
  });

  describe('#set', function () {
    it('sets value of doc', function (done) {
      doc.set({
        title: 'title2'
      });
      doc.get().then(function(snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.get('title')).to.equal('title2');
        done();
      }).catch(done);

      db.flush();
    });

    it('sets value of doc with null values', function (done) {
      doc.set({
        prop: null
      });
      doc.get().then(function(snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.get('prop')).to.equal(null);
        done();
      }).catch(done);

      db.flush();
    });

    it('sets value of doc with server timestamp', function (done) {
      doc.set({
        serverTime: Firestore.FieldValue.serverTimestamp()
      });
      doc.get().then(function(snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.get('serverTime')).to.have.property('seconds');
        done();
      }).catch(done);

      db.flush();
    });

    it('sets value of doc with ref', function (done) {
      var ref = db.doc('ref');
      ref.create();
      doc.set({
        ref: ref
      });
      doc.get().then(function(snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.get('ref')).to.have.property('ref');
        done();
      }).catch(done);

      db.flush();
    });
  });

  describe('#set with {merge: true}', function () {
    it('creates doc if does not exist', function (done) {
      doc.set({
        prop: 'value'
      }, { merge: true });

      doc.get().then(function (snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.get('prop')).to.equal('value');
        done();
      }).catch(done);

      db.flush();
    });

    it('creates doc with null values if does not exist', function (done) {
      doc.set({
        prop: null
      }, { merge: true });

      doc.get().then(function (snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.get('prop')).to.equal(null);
        done();
      }).catch(done);

      db.flush();
    });

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
        expect(snap.exists).to.equal(true);
        expect(snap.get('title')).to.equal('title2');
        expect(snap.get('nested')).to.deep.equal({ prop1: 'prop1', prop2: 'prop2' });
        done();
      }).catch(done);

      db.flush();
    });

    it('updates value of doc with null values', function (done) {
      doc.set({
        title: 'title2',
        nested: {
          prop1: 'prop1'
        }
      });
      doc.set({
        nested: {
          prop2: null
        }
      }, { merge: true });

      doc.get().then(function (snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.get('title')).to.equal('title2');
        expect(snap.get('nested')).to.deep.equal({ prop1: 'prop1', prop2: null });
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
        expect(snap.exists).to.equal(true);
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
        expect(snap.exists).to.equal(true);
        expect(snap.get('title')).to.equal('title2');
        expect(snap.get('nextTitle')).to.equal('nextTitle');
        done();
      }).catch(done);

      db.flush();
    });

    it('updates value of doc with null properties', function (done) {
      doc.set({
        title: 'title2'
      });
      doc.update({
        nextTitle: null
      });

      doc.get().then(function (snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.get('title')).to.equal('title2');
        expect(snap.get('nextTitle')).to.equal(null);
        done();
      }).catch(done);

      db.flush();
    });

    it('updates value of doc with server time value', function (done) {
      doc.update({
        serverTime: Firestore.FieldValue.serverTimestamp()
      });

      doc.get().then(function (snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.get('serverTime')).to.have.property('seconds');
        done();
      }).catch(done);

      db.flush();
    });

    it('removes property when using FieldValue.delete()', function (done) {
      doc.set({
        title: 'title2'
      });
      doc.update({
        title: Firestore.FieldValue.delete()
      });

      doc.get().then(function (snap) {
        expect(snap.exists).to.equal(true);
        expect(snap.data()).to.deep.equal({});
        done();
      }).catch(done);

      db.flush();
    });

    it('does not merge nested properties recursively by default', function (done) {
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

    it('merges nested properties recursively when using nested paths', function (done) {
      doc.set({
        nested: {
          prop1: 'prop1'
        }
      });
      doc.update({
        'nested.prop2': 'prop2'
      });

      doc.get().then(function (snap) {
        expect(snap.get('nested')).to.deep.equal({
          prop1: 'prop1',
          prop2: 'prop2'
        });
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

  describe('#getCollections', function () {
    beforeEach(function () {
      db.doc('doc/subcol/subcol-doc').set({ foo: 'bar' });
      db.doc('doc/subcol2/subcol-doc').set({ foo: 'bar' });
      db.doc('doc/subcol/subcol-doc/deep-col/deep-doc').set({ foo: 'bar' });
      db.doc('doc/subcol/subcol-doc/deep-col2/deep-doc').set({ foo: 'bar' });
      db.flush();
    });
    afterEach(function () {
      db.doc('doc/subcol/subcol-doc').delete();
      db.doc('doc/subcol2/subcol-doc').delete();
      db.doc('doc/subcol/subcol-doc/deep-col/deep-doc').delete();
      db.doc('doc/subcol/subcol-doc/deep-col2/deep-doc').delete();
      db.flush();
    });

    context('when present', function () {
      it('returns collections of document', function (done) {
        db.doc('doc').getCollections().then(function (colRefs) {
          expect(colRefs).to.be.an('array');
          expect(colRefs).to.have.length(2);
          expect(colRefs[0].path).to.equal('doc/subcol');
          expect(colRefs[1].path).to.equal('doc/subcol2');
          done();
        });
        db.flush();
      });

      it('returns deeply nested collections of document', function (done) {
        db.doc('doc/subcol/subcol-doc').getCollections().then(function (colRefs) {
          expect(colRefs).to.be.an('array');
          expect(colRefs).to.have.length(2);
          expect(colRefs[0].path).to.equal('doc/subcol/subcol-doc/deep-col');
          expect(colRefs[1].path).to.equal('doc/subcol/subcol-doc/deep-col2');
          done();
        });
        db.flush();
      });
    });

    context('when not present', function () {
      it('returns empty list of collections', function (done) {
        db.doc('not-existing').getCollections().then(function (colRefs) {
          expect(colRefs).to.be.an('array');
          expect(colRefs).to.have.length(0);
          done();
        });
        db.flush();
      });

      it('skips collections that has no documents', function (done) {
        db.doc('doc/subcol/subcol-doc').delete();
        db.doc('doc/subcol2/subcol-doc').delete();
        db.doc('doc/subcol/subcol-doc/deep-col/deep-doc').delete();
        db.doc('doc/subcol/subcol-doc/deep-col2/deep-doc').delete();
        db.flush();

        db.doc('doc').getCollections().then(function (colRefs) {
          expect(colRefs).to.be.an('array');
          expect(colRefs).to.have.length(0);
          done();
        });
        db.flush();
      });
    });
  });
});
