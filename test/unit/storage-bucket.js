'use strict';

var chai = require('chai');
var sinon = require('sinon');
var Promise = require('rsvp').Promise;

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var _ = require('../../src/lodash');
var Storage = require('../../src/storage');
var StorageBucket = require('../../src/storage-bucket');

describe('StorageBucket', function () {
  var bucket;
  beforeEach(function () {
    bucket = new StorageBucket(new Storage(), 'name');
  });

  describe('constructor', function() {
    it('should add storage reference', function() {
      var storage = new Storage();
      var bucket = new StorageBucket(storage, 'name');
      expect(bucket.storage).to.equal(storage);
    });
  });

  describe('#file', function() {
    it('should create file', function() {
      var file = bucket.file('name2');
      expect(file.bucket).to.equal(bucket);
      expect(file.name).to.equal('name2');
    });
  });
});
