'use strict';

var sinon = require('sinon');
var expect = require('chai').use(require('sinon-chai')).expect;
var _ = require('lodash');
var removeEmptyProperties = require('../../src/utils').removeEmptyProperties;
var updateToObject = require('../../src/utils').updateToObject;

describe('utils', function () {
  describe('removeEmptyProperties', function () {

    it('should return null, when the obj is empty', function () {
      expect(removeEmptyProperties({})).to.equal(null);
    });

    it('should make no changes, when obj does not contain an empty property', function () {
      expect(removeEmptyProperties({a: 1})).to.eql({a: 1});
    });

    it('should make no changes, when obj is a bool', function () {
      expect(removeEmptyProperties(true)).to.eql(true);
    });

    it('should make no changes, when obj is a string', function () {
      expect(removeEmptyProperties('hi')).to.eql('hi');
    });

    it('should make no changes, when obj is a number', function () {
      expect(removeEmptyProperties(123)).to.eql(123);
    });

    it('should make no changes, when obj is a NaN', function () {
      expect(removeEmptyProperties(NaN)).to.eql(NaN);
    });

    it('should make no changes, when obj is a undefined', function () {
      expect(removeEmptyProperties(undefined)).to.eql(undefined);
    });

    it('should remove property, when it is null', function () {
      expect(removeEmptyProperties({a: 1, b: null})).to.eql({a: 1});
    });
    it('should remove property, when it is an empty object', function () {
      expect(removeEmptyProperties({a: 1, b: {}})).to.eql({a: 1});
    });
    it('should remove property, when it is an empty array', function () {
      expect(removeEmptyProperties({a: 1, b: []})).to.eql({a: 1});
    });
    it('should return null, when all properties are null ', function () {
      expect(removeEmptyProperties({a: {b: null}})).to.eql(null);
    });
  });

  describe('updateToObject', function () {
    it('should split the properties by slash', function () {
      var update = {};
      update['some/prop'] = 12;
      expect(updateToObject(update)).to.deep.eql({some: {prop: 12}});
    });
    it('should not overwrite updates to the same branch', function () {
      var update = {};
      update['some/prop'] = 12;
      update['some/other'] = 13;
      expect(updateToObject(update)).to.deep.eql({some: {prop: 12, other: 13}});
    });
    it('should not touch properties without slash', function () {
      var update = {prop: 12};
      expect(updateToObject(update)).to.deep.eql({prop: 12});
    });
  });

});