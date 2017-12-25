'use strict';

var expect   = require('chai').use(require('sinon-chai')).expect;
var sinon    = require('sinon');
var DeltaSnapshot = require('../../src/firestore-delta-document-snapshot');
var Firestore = require('../../').MockFirestore;

describe('DocumentDeltaSnapshot', function () {

  var db;
  beforeEach(function () {
    db = new Firestore();
  });

  describe('#exists', function () {
    it('returns false if no data', function () {
      expect(new DeltaSnapshot('id').exists).to.equal(false);
    });

    it('returns true if data available', function () {
      expect(new DeltaSnapshot('id', {
        hello: 123
      }).exists).to.equal(true);
    });
  });

  describe('#data', function () {
    it('returns null if no data', function () {
      expect(new DeltaSnapshot('id').data()).to.equal(null);
    });

    it('returns data if data provided', function () {
      var data = {
        hello: 123
      };
      expect(new DeltaSnapshot('id', data).data()).to.deep.equal(data);
    });
  });

  describe('#get', function () {
    it('returns data at child path', function () {
      var data = {
        hello: 123
      };
      expect(new DeltaSnapshot('id', data).get('hello')).to.equal(123);
    });
  });
});
