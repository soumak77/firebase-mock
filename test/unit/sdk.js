'use strict';

var sinon    = require('sinon');
var expect   = require('chai').use(require('sinon-chai')).expect;
var _        = require('../../src/lodash');
var Authentication = require('../../').MockAuthentication;
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

    it('ServerValue', function () {
      expect(firebase.database.ServerValue).to.be.an('object');
    });
  });

  describe('#firestore', function() {
    beforeEach(function() {
      firebase = MockFirebaseSdk();
    });

    it('returns object with doc and collection functions', function () {
      var database = firebase.firestore();
      expect(database)
        .to.have.property('doc')
        .that.is.an('function');
      expect(database)
        .to.have.property('collection')
        .that.is.an('function');
    });

    it('FieldValue.delete', function () {
      expect(firebase.firestore.FieldValue.delete).to.be.a('function');
    });

    it('FieldValue.serverTimestamp', function () {
      expect(firebase.firestore.FieldValue.serverTimestamp).to.be.a('function');
    });

    it('FieldPath.documentId', function () {
      expect(firebase.firestore.FieldPath.documentId).to.be.a('function');
    });
  });

  describe('#auth', function() {
    beforeEach(function() {
      firebase = MockFirebaseSdk();
    });

    it('returns Authentication object without ref property', function () {
      var auth = firebase.auth();
      expect(auth).to.be.instanceof(Authentication);
      expect(auth).to.not.have.property('ref');
    });

    describe('#EmailAuthProvider', function() {
      it('sets provider id', function () {
        var auth = new firebase.auth.EmailAuthProvider();
        expect(auth)
          .to.have.property('providerId')
          .that.equals('password');
      });

      it('should get credential', function () {
        var auth = firebase.auth.EmailAuthProvider.credential('token');
        expect(auth)
          .to.have.property('providerId')
          .that.equals('password');
      });
    });

    describe('#GoogleAuthProvider', function() {
      it('sets provider id', function () {
        var auth = new firebase.auth.GoogleAuthProvider();
        expect(auth)
          .to.have.property('providerId')
          .that.equals('google.com');
      });

      it('should get credential', function () {
        var auth = firebase.auth.GoogleAuthProvider.credential('token');
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

      it('should get credential', function () {
        var auth = firebase.auth.TwitterAuthProvider.credential('token');
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

      it('should get credential', function () {
        var auth = firebase.auth.FacebookAuthProvider.credential('token');
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

    it('should get credential', function () {
      var auth = firebase.auth.GithubAuthProvider.credential('token');
      expect(auth)
        .to.have.property('providerId')
        .that.equals('github.com');
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
