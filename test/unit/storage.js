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
});
