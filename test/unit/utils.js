'use strict';

var sinon = require('sinon');
var expect = require('chai').use(require('sinon-chai')).expect;
var _ = require('../../src/lodash');
var removeEmptyRtdbProperties = require('../../src/utils').removeEmptyRtdbProperties;
var removeEmptyFirestoreProperties = require('../../src/utils').removeEmptyFirestoreProperties;
var updateToRtdbObject = require('../../src/utils').updateToRtdbObject;
var updateToFirestoreObject = require('../../src/utils').updateToFirestoreObject;
var Timestamp = require('../../src/timestamp');

describe('utils', function () {
  describe('removeEmptyRtdbProperties', function () {

    it('should return null, when the obj is empty', function () {
      expect(removeEmptyRtdbProperties({})).to.equal(null);
    });

    it('should make no changes, when obj does not contain an empty property', function () {
      expect(removeEmptyRtdbProperties({a: 1})).to.eql({a: 1});
    });

    it('should make no changes, when obj is a bool', function () {
      expect(removeEmptyRtdbProperties(true)).to.eql(true);
    });

    it('should make no changes, when obj is a string', function () {
      expect(removeEmptyRtdbProperties('hi')).to.eql('hi');
    });

    it('should make no changes, when obj is a number', function () {
      expect(removeEmptyRtdbProperties(123)).to.eql(123);
    });

    it('should make no changes, when obj is a NaN', function () {
      expect(removeEmptyRtdbProperties(NaN)).to.eql(NaN);
    });

    it('should make no changes, when obj is a undefined', function () {
      expect(removeEmptyRtdbProperties(undefined)).to.eql(undefined);
    });

    it('should remove property, when it is null', function () {
      expect(removeEmptyRtdbProperties({a: 1, b: null})).to.eql({a: 1});
    });
    it('should remove property, when it is an empty object', function () {
      expect(removeEmptyRtdbProperties({a: 1, b: {}})).to.eql({a: 1});
    });
    it('should remove property, when it is an empty array', function () {
      expect(removeEmptyRtdbProperties({a: 1, b: []})).to.eql({a: 1});
    });
    it('should return null, when all properties are null ', function () {
      expect(removeEmptyRtdbProperties({a: {b: null}})).to.eql(null);
    });
  });


  describe('removeEmptyFirestoreProperties', function () {

    it('should return null, when the obj is empty', function () {
      expect(removeEmptyFirestoreProperties({})).to.eql({});
    });

    it('should make no changes, when obj does not contain an empty property', function () {
      expect(removeEmptyFirestoreProperties({a: 1})).to.eql({a: 1});
    });

    it('should make no changes, when obj is a bool', function () {
      expect(removeEmptyFirestoreProperties(true)).to.eql(true);
    });

    it('should make no changes, when obj is a string', function () {
      expect(removeEmptyFirestoreProperties('hi')).to.eql('hi');
    });

    it('should make no changes, when obj is a number', function () {
      expect(removeEmptyFirestoreProperties(123)).to.eql(123);
    });

    it('should make no changes, when obj is a Date', function () {
      var date = new Date();
      expect(removeEmptyFirestoreProperties(date)).to.eql(date);
    });

    it('should make no changes, when obj is a Timestamp', function () {
      var ts = new Timestamp(123, 123);
      expect(removeEmptyFirestoreProperties(ts)).to.eql(ts);
    });

    it('should make no changes, when obj is a NaN', function () {
      expect(removeEmptyFirestoreProperties(NaN)).to.eql(NaN);
    });

    it('should make no changes, when obj is a undefined', function () {
      expect(removeEmptyFirestoreProperties(undefined)).to.eql(undefined);
    });

    it('should remove property, when it is null', function () {
      expect(removeEmptyFirestoreProperties({a: 1, b: null})).to.eql({a: 1, b: null});
    });
    it('should remove property, when it is an empty object', function () {
      expect(removeEmptyFirestoreProperties({a: 1, b: {}})).to.eql({a: 1, b: {}});
    });
    it('should remove property, when it is an empty array', function () {
      expect(removeEmptyFirestoreProperties({a: 1, b: []})).to.eql({a: 1, b: []});
    });
    it('should return null, when all properties are null ', function () {
      expect(removeEmptyFirestoreProperties({a: {b: null}})).to.eql({a: {b: null}});
    });
  });

  describe('updateToRtdbObject', function () {
    it('should split the properties by slash', function () {
      var update = {};
      update['some/prop'] = 12;
      expect(updateToRtdbObject(update)).to.deep.eql({some: {prop: 12}});
    });
    it('should not overwrite updates to the same branch', function () {
      var update = {};
      update['some/prop'] = 12;
      update['some/other'] = 13;
      expect(updateToRtdbObject(update)).to.deep.eql({some: {prop: 12, other: 13}});
    });
    it('should not touch properties without slash', function () {
      var update = {prop: 12};
      expect(updateToRtdbObject(update)).to.deep.eql({prop: 12});
    });
    it('should ignore leading slash', function(){
      var update = {};
      update['/entities/comments/c1'] = 'hi';
      update['entities/comments/c2'] = 'hello';
      expect(updateToRtdbObject(update)).to.deep.eql({
        entities: {
          comments: {
            c1: 'hi',
            c2: 'hello'
          }
        }
      });
    });
  });

  describe('updateToFirestoreObject', function () {
    it('should split the properties by dot', function () {
      var update = {};
      update['some/prop'] = 12;
      expect(updateToRtdbObject(update)).to.deep.eql({some: {prop: 12}});
    });
    it('should not overwrite updates to the same branch', function () {
      var update = {};
      update['some.prop'] = 12;
      update['some.other'] = 13;
      expect(updateToFirestoreObject(update)).to.deep.eql({some: {prop: 12, other: 13}});
    });
    it('should not touch properties without dot', function () {
      var update = {prop: 12};
      expect(updateToFirestoreObject(update)).to.deep.eql({prop: 12});
    });
    it('should ignore leading slash', function(){
      var update = {};
      update['.entities.comments.c1'] = 'hi';
      update['entities.comments.c2'] = 'hello';
      expect(updateToFirestoreObject(update)).to.deep.eql({
        entities: {
          comments: {
            c1: 'hi',
            c2: 'hello'
          }
        }
      });
    });
  });
});
