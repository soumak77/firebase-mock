'use strict';

var os = require('os');
var fs = require('fs');
var path = require('path');
var chai = require('chai');
var sinon = require('sinon');
var Promise = require('rsvp').Promise;

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

var expect = chai.expect;
var _ = require('../../src/lodash');
var Storage = require('../../src/storage');
var StorageBucket = require('../../src/storage-bucket');
var StorageFile = require('../../src/storage-file');

describe('StorageFile', function () {
  var file, filename = 'filename';
  beforeEach(function () {
    file = new StorageFile(new StorageBucket(new Storage(), 'name'), filename);
  });

  describe('constructor', function() {
    it('should add bucket reference', function() {
      var storage = new Storage();
      var bucket = new StorageBucket(storage, 'name');
      var file = new StorageFile(bucket, 'name');
      expect(file.bucket).to.equal(bucket);
    });
  });

  describe('#get', function() {
    it('should get file', function() {
      return file.get().then(function(results) {
        expect(results.length).to.equal(2);
        expect(results[0]).to.equal(file);
      });
    });
  });

  describe('#save', function() {
    it('should save contents', function() {
      return file.save('abc').then(function() {
        expect(file._contents).to.equal('abc');
      });
    });
  });

  describe('#exists', function() {
    it('should not exist when no content', function() {
      file._contents = null;
      expect(file.exists()).to.eventually.equal(false);
    });

    it('should exist when content added', function() {
      file._contents = 'abc';
      expect(file.exists()).to.eventually.equal(true);
    });
  });

  describe('#getSignedUrl', function() {
    it('should get url', function() {
      return file.getSignedUrl().then(function(url) {
        expect(url).to.be.a('string').that.is.not.empty; // jshint ignore:line
      });
    });
  });

  describe('#download', function() {
    it('should download file', function() {
      var filePath = path.join(os.tmpdir(), filename);
      return file.download({
        destination: filePath
      }).then(function() {
        expect(fs.existsSync(filePath)).to.equal(true);
      });
    });
  });

  describe('#delete', function() {
    it('should delete file from bucket', function() {
      return file.delete().then(function() {
        expect(file.bucket.files[filename]).to.not.be.ok; // jshint ignore:line
      });
    });

    it('should not exist after file deleted', function() {
      return file.delete().then(function() {
        expect(file.exists()).to.eventually.equal(false);
      });
    });
  });
});
