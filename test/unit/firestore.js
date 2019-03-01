'use strict';

var chai = require('chai');
var sinon = require('sinon');
var Promise = require('rsvp').Promise;

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var _ = require('../../src/lodash');
var Firestore = require('../../').MockFirestore;

describe('MockFirestore', function () {

  var db, spy;
  beforeEach(function () {
    db = new Firestore();
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

    it('creates child collection with a firestore property pointing at itself', function () {
      expect(db.collection('collections').firestore).to.equal(db);
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

    it('creates child document with a firestore property pointing at itself', function () {
      expect(db.doc('doc').firestore).to.equal(db);
    });
  });

  describe('#runTransaction', function () {
    it('transaction updates data', function (done) {
      db.autoFlush();
      db.doc('doc').set({
        name: 123
      });

      db.doc('doc').get().then(function(doc) {
        expect(doc.get('name')).to.equal(123);
        db.runTransaction(function(transaction) {
          return transaction.get(db.doc('doc')).then(function(doc) {
            transaction.update(db.doc('doc'), {
              name: 'abc'
            });
          });
        }).then(function() {
          db.doc('doc').get().then(function(doc2) {
            expect(doc2.get('name')).to.equal('abc');
            done();
          }).catch(done);
        }).catch(done);
      }).catch(done);
    });

    it('returns the return value of the passed function', function () {
      db.autoFlush();

      return db.runTransaction(function(transaction) {
        return transaction.get(db.doc('doc')).then(function() {
          return 'cba';
        });
      }).then(function(transactionReturn) {
        expect(transactionReturn).to.equal('cba');
      });
    });
  });

  describe('#batch', function () {
    it('batch runs commands after commit', function (done) {
      db.collection('collections').doc('a').set({
        name: 123
      });
      db.flush();

      Promise.all([
        expect(db.doc('doc2').get()).to.eventually.have.property('exists').equal(false),
        expect(db.collection('collections').doc('a').get()).to.eventually.have.property('exists').equal(true)
      ]).then(function() {
        var batch = db.batch();
        batch.create(db.doc('docToCreate'), {
          name: 'abc'
        });
        batch.update(db.doc('doc'), {
          name: 'abc'
        });
        batch.set(db.doc('doc2'), {
          number: '123'
        });
        batch.delete(db.collection('collections').doc('a'));
        batch.commit().then(function() {
          Promise.all([
            expect(db.doc('docToCreate').get()).to.eventually.have.property('exists').equal(true),
            expect(db.doc('doc2').get()).to.eventually.have.property('exists').equal(true),
            expect(db.collection('collections').doc('a').get()).to.eventually.have.property('exists').equal(false)
          ]).then(function() {
            done();
          }).catch(done);

          db.flush();
        }).catch(done);
      }).catch(done);

      db.flush();
    });

    it('works with set + merge', function (done) {
      var batch = db.batch();
      batch.set(db.doc('doc'), {
        name: null
      }, { merge: true });
      batch.commit();

      db.doc('doc').get().then(function(doc) {
        expect(doc.exists).to.equal(true);
        expect(doc.get('name')).to.equal(null);
        done();
      });

      db.flush();
    });

    it('supports method chaining', function () {
      var doc1 = db.doc('doc1');
      var doc2 = db.doc('doc2');
      var doc3 = db.doc('doc3');
      var doc4 = db.doc('doc4');

      doc3.set({value: -1});
      doc4.set({value: 4});

      db.batch()
        .set(doc1, {value: 1})
        .set(doc2, {value: 2})
        .update(doc3, {value: 3})
        .delete(doc4)
        .commit();

      var awaitChecks = Promise
        .all([doc1.get(), doc2.get(), doc3.get(), doc4.get()])
        .then(function(snaps) {
          expect(snaps[0].data()).to.deep.equal({value: 1});
          expect(snaps[1].data()).to.deep.equal({value: 2});
          expect(snaps[2].data()).to.deep.equal({value: 3});
          expect(snaps[3].exists).to.equal(false);
        });

      db.flush();

      return awaitChecks;
    });

    context('when "batch.commit" is not called', function () {
      afterEach(function () {
        db.doc('col/batch-foo').delete();
        db.doc('col/batch-bar').delete();
        db.flush();
      });

      it('does not create documents', function (done) {
        var batch = db.batch();
        batch.set(db.doc('col/batch-foo'), { foo: 'fooo' });
        batch.set(db.doc('col/batch-bar'), { bar: 'barr' });

        expect(function () { db.flush(); }).to.throw('No deferred tasks to be flushed');

        var promises = [
          db.doc('col/batch-foo').get(),
          db.doc('col/batch-bar').get()
        ];
        db.flush();

        Promise.all(promises).then(function (docs) {
          expect(docs[0].exists).to.eq(false);
          expect(docs[1].exists).to.eq(false);
          done();
        });
      });
    });
  });

  describe('#getAll', function() {
    it('requires one argument', function() {
      expect(db.getAll).to.throw('Function requires at least 1 argument');
    });
    it('gets the value of all passed documents', function() {
      var doc1 = db.doc('doc1');
      var doc2 = db.doc('doc2');
      var doc3 = db.doc('doc3');

      doc1.set({value: 1});
      doc2.set({value: 2});

      var getAll = db
        .getAll(doc1, doc2, doc3);

      db.flush();

      return getAll.then(function(snaps) {
        expect(snaps[0].data()).to.deep.equal({value: 1});
        expect(snaps[1].data()).to.deep.equal({value: 2});
        expect(snaps[2].exists).to.equal(false);
      });
    });
    it('gets the value of all passed documents honoring the read options', function() {
      var doc1 = db.doc('doc1');
      var doc2 = db.doc('doc2');

      doc1.set({value: 1});
      doc2.set({value: 2});

      var getAll = db
        .getAll(doc1, doc2, { fieldMask: ['value'] });

      db.flush();

      return getAll.then(function(snaps) {
        expect(snaps[0].data()).to.deep.equal({value: 1});
        expect(snaps[1].data()).to.deep.equal({value: 2});
      });
    });
  });
});
