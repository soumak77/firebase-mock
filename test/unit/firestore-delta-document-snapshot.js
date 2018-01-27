'use strict';

var expect   = require('chai').use(require('sinon-chai')).expect;
var sinon    = require('sinon');
var DeltaSnapshot = require('../../src/firestore-delta-document-snapshot');
var FirebaseSdk = require('../../').MockFirebaseSdk;

describe('DocumentDeltaSnapshot', function () {

  var sdk;
  beforeEach(function () {
    sdk = new FirebaseSdk();
  });

  describe('#exists', function () {
    it('returns false if no data', function () {
      expect(new DeltaSnapshot('id').exists).to.equal(false);
    });

    it('returns true if data available', function () {
      expect(new DeltaSnapshot('id', {
        hello: 123
      }).exists).to.equal(true);
    });
  });

  describe('#data', function () {
    it('returns null if no data', function () {
      expect(new DeltaSnapshot('id').data()).to.equal(null);
    });

    it('returns data if data provided', function () {
      var data = {
        hello: 123
      };
      expect(new DeltaSnapshot('id', data).data()).to.deep.equal(data);
    });
  });

  describe('#get', function () {
    it('returns undefined if data does not exist', function () {
      var data = null;
      expect(new DeltaSnapshot('docid', data).get('path')).to.equal(undefined);
    });
    it('returns undefined if data does not exist', function () {
      var data = {};
      expect(new DeltaSnapshot('docid', data).get('path')).to.equal(undefined);
    });
    it('returns undefined if path is empty', function () {
      var data = {
        hello: 123
      };
      expect(new DeltaSnapshot('docid', data).get('')).to.equal(undefined);
    });
    it('returns undefined if path does not exist', function () {
      var data = {
        hello: 123
      };
      expect(new DeltaSnapshot('docid', data).get('world')).to.equal(undefined);
    });
    it('returns data if path exists', function () {
      var data = {
        hello: 123
      };
      expect(new DeltaSnapshot('docid', data).get('hello')).to.equal(123);
    });
    it('returns data with complex path', function () {
      var data = {
        hello: {
          world: 123
        }
      };
      expect(new DeltaSnapshot('docid', data).get('hello.world')).to.equal(123);
    });
  });

  describe('#create', function () {
    it('returns snapshot at correct path', function () {
      var snapshot = DeltaSnapshot.create(sdk, {
        hello: 123
      }, {
        world: 123
      }, 'docs/docid');

      expect(snapshot.ref.path).to.equal('docs/docid');
    });

    it('returns snapshot with correct data from previous value', function () {
      var snapshot = DeltaSnapshot.create(sdk, {
        hello: 123
      }, {
        world: 123
      }, 'docs/docid');

      expect(snapshot.previous.get('hello')).to.equal(123);
      expect(snapshot.previous.get('world')).to.equal(undefined);
    });

    describe('adding doc', function () {
      it('correctly applies delta when adding doc', function () {
        var snapshot = DeltaSnapshot.create(sdk, null, {
          hello: 123
        }, 'docs/docid');

        expect(snapshot.previous.exists).to.equal(false);
        expect(snapshot.exists).to.equal(true);
        expect(snapshot.get('hello')).to.equal(123);
      });
    });

    describe('updating doc', function () {
      it('correctly applies delta when adding data', function () {
        var snapshot = DeltaSnapshot.create(sdk, {
          hello: 123
        }, {
          world: 123
        }, 'docs/docid');

        expect(snapshot.previous.exists).to.equal(true);
        expect(snapshot.exists).to.equal(true);
        expect(snapshot.previous.get('hello')).to.equal(123);
        expect(snapshot.previous.get('world')).to.equal(undefined);
        expect(snapshot.get('hello')).to.equal(123);
        expect(snapshot.get('world')).to.equal(123);
      });

      it('correctly applies delta when removing data', function () {
        var snapshot = DeltaSnapshot.create(sdk, {
          hello: 123
        }, {
          hello: undefined
        }, 'docs/docid');

        expect(snapshot.previous.exists).to.equal(true);
        expect(snapshot.exists).to.equal(true);
        expect(snapshot.previous.get('hello')).to.equal(123);
        expect(snapshot.get('hello')).to.equal(undefined);
      });

      it('correctly applies delta when changing data', function () {
        var snapshot = DeltaSnapshot.create(sdk, {
          hello: 123
        }, {
          hello: 'abc'
        }, 'docs/docid');

        expect(snapshot.previous.exists).to.equal(true);
        expect(snapshot.exists).to.equal(true);
        expect(snapshot.previous.get('hello')).to.equal(123);
        expect(snapshot.get('hello')).to.equal('abc');
      });
    });

    describe('deleting doc', function () {
      it('correctly applies delta when deleting doc', function () {
        var snapshot = DeltaSnapshot.create(sdk, {
          hello: 123
        }, null, 'docs/docid');

        expect(snapshot.previous.exists).to.equal(true);
        expect(snapshot.exists).to.equal(false);
        expect(snapshot.previous.get('hello')).to.equal(123);
      });
    });
  });
});
