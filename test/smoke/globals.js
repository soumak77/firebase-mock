'use strict';

/* jshint browser:true */
/* globals expect:false */

describe('Custom UMD Build', function () {

  var OriginalFirebase, OriginalFirebaseSimpleLogin;
  beforeEach(function () {
    window.Firebase = OriginalFirebase = {};
    window.FirebaseSimpleLogin = OriginalFirebaseSimpleLogin = {};
  });

  it('exposes the full module as "firebasemock"', function () {
    expect(window).to.have.property('firebasemock').that.is.an('object');
  });

  it('exposes "MockFirebase" on the window', function () {
    expect(window)
      .to.have.property('MockFirebase')
      .that.equals(window.firebasemock.MockFirebase);
  });

  it('exposes "MockFirebaseSimpleLogin" on the window', function () {
    expect(window)
      .to.have.property('MockFirebaseSimpleLogin')
      .that.equals(window.firebasemock.MockFirebaseSimpleLogin);
  });

  describe('#restore', function () {

    it('is a noop before #override is called', function () {
      window.MockFirebase.restore();
      expect(window)
        .to.have.property('Firebase')
        .that.equals(OriginalFirebase);
      expect(window)
        .to.have.property('FirebaseSimpleLogin')
        .that.equals(OriginalFirebaseSimpleLogin);
    });

    it('can restore Firebase', function () {
      window.MockFirebase.override();
      window.MockFirebase.restore();
      expect(window)
        .to.have.property('Firebase')
        .that.equals(OriginalFirebase);
      expect(window)
        .to.have.property('FirebaseSimpleLogin')
        .that.equals(OriginalFirebaseSimpleLogin);
    });

  });

  describe('#override', function () {

    it('can override Firebase', function () {
      window.MockFirebase.override();
      expect(window)
        .to.have.property('Firebase')
        .that.equals(window.firebasemock.MockFirebase);
      expect(window)
        .to.have.property('FirebaseSimpleLogin')
        .that.equals(window.firebasemock.MockFirebaseSimpleLogin);
    });

  });

});
