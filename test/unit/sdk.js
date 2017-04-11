'use strict';

var sinon    = require('sinon');
var expect   = require('chai').use(require('sinon-chai')).expect;
var _        = require('lodash');
var Firebase = require('../../').MockFirebase;
var MockFirebaseSdk = require('../../src/sdk');

describe('MockFirebaseSdk', function () {

  describe('#database', function() {

    it('returns object with ref properties', function () {
      var database = MockFirebaseSdk.database();
      expect(database)
        .to.have.property('ref')
        .that.is.an('function');
      expect(database)
        .to.have.property('refFromURL')
        .that.is.an('function');
    });

    describe('#ref', function() {
      it('returns a MockFirebase reference', function () {
        var path = "123";
        var ref = MockFirebaseSdk.database().ref(path);
        expect(ref)
          .to.have.property('path')
          .that.is.an('string')
          .that.equals(path);
      });
    });

    describe('#refFromURL', function() {
      it('returns a MockFirebase reference', function () {
        var url = "123";
        var ref = MockFirebaseSdk.database().refFromURL(url);
        expect(ref)
          .to.have.property('path')
          .that.is.an('string')
          .that.equals(url);
      });
    });
  });

  describe('#auth', function() {
    it('returns MockFirebase object without ref property', function () {
      var auth = MockFirebaseSdk.auth();
      expect(auth)
        .to.not.have.property('ref');
    });

    describe('#GoogleAuthProvider', function() {
      it('sets provider id', function () {
        var auth = new MockFirebaseSdk.auth.GoogleAuthProvider();
        expect(auth)
          .to.have.property('providerId')
          .that.equals('google.com');
      });
    });

    describe('#TwitterAuthProvider', function() {
      it('sets provider id', function () {
        var auth = new MockFirebaseSdk.auth.TwitterAuthProvider();
        expect(auth)
          .to.have.property('providerId')
          .that.equals('twitter.com');
      });
    });

    describe('#FacebookAuthProvider', function() {
      it('sets provider id', function () {
        var auth = new MockFirebaseSdk.auth.FacebookAuthProvider();
        expect(auth)
          .to.have.property('providerId')
          .that.equals('facebook.com');
      });
    });

    describe('#GithubAuthProvider', function() {
      it('sets provider id', function () {
        var auth = new MockFirebaseSdk.auth.GithubAuthProvider();
        expect(auth)
          .to.have.property('providerId')
          .that.equals('github.com');
      });
    });
  });

  describe('#initializeApp', function() {
    it('returns firebase app', function () {
      var app = MockFirebaseSdk.initializeApp();
      expect(app)
        .to.have.property('database')
        .that.is.an('function');
      expect(app)
        .to.have.property('auth')
        .that.is.an('function');
      expect(app)
        .to.have.property('messaging')
        .that.is.an('function');
      expect(app)
        .to.have.property('storage')
        .that.is.an('function');
    });
  });

});
