'use strict';

/* jshint browser:true */
/* globals expect:false */

describe('Custom UMD Build', function () {

  var OriginalFirebase;
  beforeEach(function () {
    window.Firebase = OriginalFirebase = {};
  });

  it('exposes the full module as "firebasemock"', function () {
    expect(window).to.have.property('firebasemock').that.is.an('object');
  });

  it('exposes "MockFirebase" on the window', function () {
    expect(window)
      .to.have.property('MockFirebase')
      .that.equals(window.firebasemock.MockFirebase);
  });

  describe('#restore', function () {

    it('is a noop before #override is called', function () {
      window.MockFirebase.restore();
      expect(window)
        .to.have.property('Firebase')
        .that.equals(OriginalFirebase);
    });

    it('can restore Firebase', function () {
      window.MockFirebase.override();
      window.MockFirebase.restore();
      expect(window)
        .to.have.property('Firebase')
        .that.equals(OriginalFirebase);
    });

  });

  describe('#override', function () {

    it('can override Firebase', function () {
      window.MockFirebase.override();
      expect(window)
        .to.have.property('Firebase')
        .that.equals(window.firebasemock.MockFirebase);
    });

  });

});
