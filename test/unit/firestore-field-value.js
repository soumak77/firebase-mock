'use strict';

var chai = require('chai');
var sinon = require('sinon');
var Promise = require('rsvp').Promise;

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var _ = require('../../src/lodash');
var FieldValue = require('../../src/firestore-field-value');

describe('FieldValue', function () {
  describe('#delete', function () {
    it('should be a function', function () {
      expect(FieldValue.delete).to.be.a('function');
    });
    it('should return FieldValue', function () {
      expect(FieldValue.delete()).to.be.instanceof(FieldValue);
    });
    it('should type to "delete"', function () {
      expect(FieldValue.delete()).to.have.property('type').to.equal('delete');
    });
  });

  describe('#serverTimestamp', function () {
    it('should be a function', function () {
      expect(FieldValue.serverTimestamp).to.be.a('function');
    });
    it('should return FieldValue', function () {
      expect(FieldValue.serverTimestamp()).to.be.instanceof(FieldValue);
    });
    it('should type to "serverTimestamp"', function () {
      expect(FieldValue.serverTimestamp()).to.have.property('type').to.equal('serverTimestamp');
    });
  });

  describe('#arrayRemove', function () {
    it('should be a function', function () {
      expect(FieldValue.arrayRemove).to.be.a('function');
    });
    it('should return FieldValue', function () {
      expect(FieldValue.arrayRemove()).to.be.instanceof(FieldValue);
    });
    it('should type to "serverTimestamp"', function () {
      expect(FieldValue.arrayRemove()).to.have.property('type').to.equal('arrayRemove');
    });
  });

  describe('#arrayUnion', function () {
    it('should be a function', function () {
      expect(FieldValue.arrayUnion).to.be.a('function');
    });
    it('should return FieldValue', function () {
      expect(FieldValue.arrayUnion()).to.be.instanceof(FieldValue);
    });
    it('should type to "serverTimestamp"', function () {
      expect(FieldValue.arrayUnion()).to.have.property('type').to.equal('arrayUnion');
    });
  });

  describe('#isEqual', function () {
    it('should be a function', function () {
      expect(FieldValue.delete().isEqual).to.be.a('function');
    });
    it('should work with FieldValue.delete()', function () {
      expect(FieldValue.delete().isEqual(undefined)).to.equal(false);
      expect(FieldValue.delete().isEqual(null)).to.equal(false);
      expect(FieldValue.delete().isEqual(FieldValue.delete())).to.equal(true);
    });
    it('should work with FieldValue.serverTimestamp()', function () {
      expect(FieldValue.serverTimestamp().isEqual(undefined)).to.equal(false);
      expect(FieldValue.serverTimestamp().isEqual(null)).to.equal(false);
      expect(FieldValue.serverTimestamp().isEqual(new Date())).to.equal(false);
      expect(FieldValue.serverTimestamp().isEqual(FieldValue.serverTimestamp())).to.equal(true);
    });
  });
});
