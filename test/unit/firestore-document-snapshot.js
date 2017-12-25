'use strict';

var expect   = require('chai').use(require('sinon-chai')).expect;
var sinon    = require('sinon');
var Snapshot = require('../../src/firestore-document-snapshot');
var Firestore = require('../../').MockFirestore;

describe('DocumentSnapshot', function () {

  var db;
  beforeEach(function () {
    db = new Firestore();
  });

  describe('#exists', function () {
    it('returns false if no data', function () {
      expect(new Snapshot().exists).to.equal(false);
    });

    it('returns true if data available', function () {
      expect(new Snapshot({
        hello: 123
      }).exists).to.equal(true);
    });
  });

  describe('#data', function () {
    it('returns null if no data', function () {
      expect(new Snapshot().data()).to.equal(null);
    });

    it('returns data if data provided', function () {
      var data = {
        hello: 123
      };
      expect(new Snapshot(data).data()).to.deep.equal(data);
    });
  });

  describe('#get', function () {
    it('returns data at child path', function () {
      var data = {
        hello: 123
      };
      expect(new Snapshot(data).get('hello')).to.equal(123);
    });
  });
});
