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
  var storage;
  beforeEach(function () {
    storage = new Storage();
  });

  describe('constructor', function() {
    it('should add storage reference', function() {
      var bucket = new StorageBucket(storage, 'name');
      expect(bucket.storage).to.equal(storage);
    });
  });

  describe('#file', function() {
    it('should create file', function() {
      var bucket = new StorageBucket(storage, 'name');
      var file = bucket.file('filename');
      expect(file.bucket).to.equal(bucket);
      expect(file.name).to.equal('filename');
    });
  });

  describe('#getFiles', function() {
    it('should get all files without query', function() {
      var bucket = new StorageBucket(storage, 'name');
      var file = bucket.file('filename');
      var file2 = bucket.file('filename2');
      return bucket.getFiles().then(function(files) {
        expect(files.length).to.equal(2);
      });
    });

    it('should get only matched prefix files', function() {
      var bucket = new StorageBucket(storage, 'name');
      var file = bucket.file('path1/filename');
      var file2 = bucket.file('path2/filename');
      return bucket.getFiles({
        prefix: 'path1'
      }).then(function(files) {
        expect(files.length).to.equal(1);
        expect(files[0].name).to.equal('path1/filename');
      });
    });
  });

  describe('#deleteFiles', function() {
    it('should delete all files without query', function() {
      var bucket = new StorageBucket(storage, 'name');
      var file = bucket.file('filename');
      var file2 = bucket.file('filename2');
      return bucket.deleteFiles().then(function(files) {
        expect(Object.keys(bucket.files).length).to.equal(0);
        expect(bucket.files['path1/filename']).to.not.be.ok; // jshint ignore:line
        expect(bucket.files['path2/filename']).to.not.be.ok; // jshint ignore:line
      });
    });

    it('should delete only matched prefix files', function() {
      var bucket = new StorageBucket(storage, 'name');
      var file = bucket.file('path1/filename');
      var file2 = bucket.file('path2/filename');
      return bucket.deleteFiles({
        prefix: 'path1'
      }).then(function(files) {
        expect(Object.keys(bucket.files).length).to.equal(1);
        expect(bucket.files['path1/filename']).to.not.be.ok; // jshint ignore:line
        expect(bucket.files['path2/filename']).to.be.ok; // jshint ignore:line
      });
    });
  });
});
