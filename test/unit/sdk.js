'use strict';

var sinon    = require('sinon');
var expect   = require('chai').use(require('sinon-chai')).expect;
var _        = require('lodash');
var Firebase = require('../../').MockFirebase;
var MockFirebaseSdk = require('../../src/sdk');

describe('MockFirebaseSdk', function () {
  var firebase;

  describe('Dependency Injection', function() {
    var database, auth;

    beforeEach(function() {
      firebase = MockFirebaseSdk(function(path) {
        return (database = new Firebase(path));
      }, function() {
        return (auth = new Firebase());
      });
    });

    it('returns DI for database().ref()', function () {
      expect(firebase.database().ref()).to.eql(database);
    });

    it('returns DI for database().refFromURL()', function () {
      expect(firebase.database().refFromURL()).to.eql(database);
    });

    it('returns DI for auth()', function () {
      expect(firebase.auth()).to.eql(auth);
    });
  });

  describe('#database', function() {
    beforeEach(function() {
      firebase = MockFirebaseSdk();
    });

    it('returns object with ref properties', function () {
      var database = firebase.database();
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
        var ref = firebase.database().ref(path);
        expect(ref)
          .to.be.instanceof(Firebase)
          .to.have.property('path')
          .that.is.an('string')
          .that.equals(path);
      });
    });

    describe('#refFromURL', function() {
      it('returns a MockFirebase reference', function () {
        var url = "123";
        var ref = firebase.database().refFromURL(url);
        expect(ref)
          .to.be.instanceof(Firebase)
          .to.have.property('path')
          .that.is.an('string')
          .that.equals(url);
      });
    });
  });

  describe('#auth', function() {
    beforeEach(function() {
      firebase = MockFirebaseSdk();
    });

    it('returns MockFirebase object without ref property', function () {
      var auth = firebase.auth();
      expect(auth)
        .to.be.instanceof(Firebase);
      expect(auth)
        .to.not.have.property('ref');
    });

    describe('#GoogleAuthProvider', function() {
      it('sets provider id', function () {
        var auth = new firebase.auth.GoogleAuthProvider();
        expect(auth)
          .to.have.property('providerId')
          .that.equals('google.com');
      });
    });

    describe('#TwitterAuthProvider', function() {
      it('sets provider id', function () {
        var auth = new firebase.auth.TwitterAuthProvider();
        expect(auth)
          .to.have.property('providerId')
          .that.equals('twitter.com');
      });
    });

    describe('#FacebookAuthProvider', function() {
      it('sets provider id', function () {
        var auth = new firebase.auth.FacebookAuthProvider();
        expect(auth)
          .to.have.property('providerId')
          .that.equals('facebook.com');
      });
    });

    describe('#GithubAuthProvider', function() {
      it('sets provider id', function () {

        var auth = new firebase.auth.GithubAuthProvider();
        expect(auth)
          .to.have.property('providerId')
          .that.equals('github.com');
      });
    });
  });

  describe('#initializeApp', function() {
    beforeEach(function() {
      firebase = MockFirebaseSdk();
    });

    it('returns firebase app', function () {
      var app = firebase.initializeApp();
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
