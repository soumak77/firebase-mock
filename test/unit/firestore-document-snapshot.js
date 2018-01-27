'use strict';

var expect   = require('chai').use(require('sinon-chai')).expect;
var sinon    = require('sinon');
var Snapshot = require('../../src/firestore-document-snapshot');
var Firestore = require('../../').MockFirestore;

describe('DocumentSnapshot', function () {

  var db, ref;
  beforeEach(function () {
    db = new Firestore();
    ref = db.doc('docid');
  });

  describe('#exists', function () {
    it('returns false if no data', function () {
      expect(new Snapshot('docid', ref).exists).to.equal(false);
    });

    it('returns true if data available', function () {
      expect(new Snapshot('docid', ref, {
        hello: 123
      }).exists).to.equal(true);
    });
  });

  describe('#data', function () {
    it('returns null if no data', function () {
      expect(new Snapshot('docid', ref).data()).to.equal(null);
    });

    it('returns data if data provided', function () {
      var data = {
        hello: 123
      };
      expect(new Snapshot('docid', ref, data).data()).to.deep.equal(data);
    });
  });

  describe('#get', function () {
    it('returns undefined if data does not exist', function () {
      var data = null;
      expect(new Snapshot('docid', ref, data).get('path')).to.equal(undefined);
    });
    it('returns undefined if data does not exist', function () {
      var data = {};
      expect(new Snapshot('docid', ref, data).get('path')).to.equal(undefined);
    });
    it('returns undefined if path is empty', function () {
      var data = {
        hello: 123
      };
      expect(new Snapshot('docid', ref, data).get('')).to.equal(undefined);
    });
    it('returns undefined if path does not exist', function () {
      var data = {
        hello: 123
      };
      expect(new Snapshot('docid', ref, data).get('world')).to.equal(undefined);
    });
    it('returns data if path exists', function () {
      var data = {
        hello: 123
      };
      expect(new Snapshot('docid', ref, data).get('hello')).to.equal(123);
    });
    it('returns data with complex path', function () {
      var data = {
        hello: {
          world: 123
        }
      };
      expect(new Snapshot('docid', ref, data).get('hello.world')).to.equal(123);
    });
  });

  describe('#ref', function () {
    it('returns ref for document', function () {
      var data = {
        hello: 123
      };
      expect(new Snapshot('docid', ref, data).ref).to.equal(ref);
    });
  });
});
