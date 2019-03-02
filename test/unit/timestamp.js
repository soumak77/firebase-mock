'use strict';

var expect   = require('chai').use(require('sinon-chai')).expect;
var sinon    = require('sinon');
var Timestamp = require('../../src/timestamp');

describe('Timestamp', function () {
  describe('fromDate', function () {
    it('should convert from date', function () {
      var date = new Date('2009-02-13T23:31:30.123456789Z');
      var timestamp = Timestamp.fromDate(date);
      expect(timestamp.seconds).to.equal(1234567890);
      expect(timestamp.nanoseconds).to.equal(123000000);
    });
  });
  describe('fromMillis', function () {
    it('should convert from milliseconds', function () {
      var timestamp = Timestamp.fromMillis(1234567890123);
      expect(timestamp.seconds).to.equal(1234567890);
      expect(timestamp.nanoseconds).to.equal(123000000);
    });
  });
  describe('#toDate', function () {
    it('should convert to date', function () {
      var ts = new Timestamp(1234567890, 123456789);
      var date = ts.toDate();
      expect(date.toISOString()).to.equal('2009-02-13T23:31:30.123Z');
    });
  });
});
