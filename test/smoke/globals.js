'use strict';

describe('Custom UMD Build', function () {

  it('exposes the full module as "mockfirebase"', function () {
    expect(window).to.have.property('mockfirebase').that.is.ok;
  });

  it('exposes "MockFirebase" on the window', function () {
    expect(window)
      .to.have.property('MockFirebase')
      .that.equals(mockfirebase.MockFirebase);
  });

  it('exposes "MockFirebaseSimpleLogin" on the window', function () {
    expect(window)
      .to.have.property('MockFirebaseSimpleLogin')
      .that.equals(mockfirebase.MockFirebaseSimpleLogin);
  });

});
