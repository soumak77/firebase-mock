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
var StorageReference = require('../../src/storage-reference');

describe('StorageFile', function () {
  var storage;
  beforeEach(function () {
    storage = new Storage();
  });

  describe('constructor', function() {
    it('should add storage reference', function() {
      var ref = new StorageReference(storage, null, 'name');
      expect(ref.storage).to.equal(storage);
    });
  });

  describe('#child', function() {
    it('should work with basic path', function() {
      var parent = new StorageReference(storage, null, 'parent');
      var ref = new StorageReference(storage, parent, 'name');
      expect(parent.child('name')).to.equal(ref);
    });

    it('should work with complex path', function() {
      var parent = new StorageReference(storage, null, 'parent');
      var child = new StorageReference(storage, parent, 'child');
      var ref = new StorageReference(storage, child, 'name');
      expect(parent.child('child/name')).to.equal(ref);
    });
  });

  describe('#getDownloadURL', function() {
    it('should get url', function() {
      var ref = new StorageReference(storage, null, 'name');
      return ref.getDownloadURL().then(function(url) {
        expect(url).to.be.a('string').that.is.not.empty; // jshint ignore:line
      });
    });
  });
});
