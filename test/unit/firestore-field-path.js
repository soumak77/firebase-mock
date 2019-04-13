'use strict';

var chai = require('chai');
var sinon = require('sinon');
var Promise = require('rsvp').Promise;

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var _ = require('../../src/lodash');
var FieldPath = require('../../src/firestore-field-path');

describe('FieldPath', function () {
  describe('constructor', function () {
    it('should have path to "name"', function () {
      expect(new FieldPath('name')).to.have.property('_path').to.deep.equal(['name']);
    });
  });
  describe('#documentId', function () {
    it('should be a function', function () {
      expect(FieldPath.documentId).to.be.a('function');
    });
    it('should return FieldPath', function () {
      expect(FieldPath.documentId()).to.be.instanceof(FieldPath);
    });
    it('should have path to "documentId"', function () {
      expect(FieldPath.documentId()).to.have.property('_path').to.deep.equal(['_DOCUMENT_ID']);
    });
  });

  describe('#isEqual', function () {
    it('should be a function', function () {
      expect(FieldPath.documentId().isEqual).to.be.a('function');
    });
    it('should work with FieldPath.delete()', function () {
      expect(FieldPath.documentId().isEqual(undefined)).to.equal(false);
      expect(FieldPath.documentId().isEqual(null)).to.equal(false);
      expect(FieldPath.documentId().isEqual(FieldPath.documentId())).to.equal(true);
    });
  });
});
