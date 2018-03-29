'use strict';

var chai = require('chai');
var sinon = require('sinon');
var Promise = require('rsvp').Promise;

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var _ = require('../../src/lodash');
var Storage = require('../../src/storage');

describe('Storage', function () {
  var storage;
  beforeEach(function () {
    storage = new Storage();
  });

  describe('#bucket', function() {
    it('should create bucket', function() {
      var bucket = storage.bucket('name');
      expect(bucket.name).to.equal('name');
    });
  });

  describe('#ref', function() {
    it('should work with basic path', function() {
      var ref = storage.ref('name');
      expect(ref.name).to.equal('name');
      expect(ref.fullPath).to.equal('name');
    });

    it('should work with complex path', function() {
      var ref = storage.ref('parent/name');
      expect(ref.name).to.equal('name');
      expect(ref.fullPath).to.equal('parent/name');
    });

    it('should work with leading slash in path', function() {
      var ref = storage.ref('/parent/name');
      expect(ref.name).to.equal('name');
      expect(ref.fullPath).to.equal('parent/name');
    });

    it('should work with trailing slash in path', function() {
      var ref = storage.ref('parent/name/');
      expect(ref.name).to.equal('name');
      expect(ref.fullPath).to.equal('parent/name');
    });

    it('should work with multiple consecutive slashes in path', function() {
      var ref = storage.ref('parent//name');
      expect(ref.name).to.equal('name');
      expect(ref.fullPath).to.equal('parent/name');
    });
  });
});
