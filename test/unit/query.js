'use strict';

var sinon     = require('sinon');
var _         = require('lodash');
var expect    = require('chai').use(require('sinon-chai')).expect;
var Query     = require('../../src/query');
var Firebase  = require('../../').MockFirebase;

describe('MockQuery', function () {

  var ref, query;
  beforeEach(function () {
    ref = new Firebase().child('ordered');
    ref.set(require('./data.json').ordered);
    ref.flush();
    query = new Query(ref);
  });

  describe('#ref', function() {

    it('returns the ref used to create the query', function() {
      expect(ref.limit(2).startAt('a').ref).to.equal(ref);
    });

  });

  describe('#flush', function () {

    it('flushes the ref', function () {
      sinon.stub(ref, 'flush');
      expect(query.flush(1, 2)).to.equal(query);
      expect(ref.flush)
        .to.have.been.calledOn(ref)
        .and.calledWith(1, 2);
    });

  });

  describe('#autoFlush', function () {

    it('autoFlushes the ref', function () {
      sinon.stub(ref, 'autoFlush');
      expect(query.autoFlush(1, 2)).to.equal(query);
      expect(ref.autoFlush)
        .to.have.been.calledOn(ref)
        .and.calledWith(1, 2);
    });

  });

  describe('#getData', function () {

    it('gets data from the slice', function () {
      expect(query.getData()).to.deep.equal(query.slice().data);
    });

  });

  describe('#fakeEvent', function () {

    it('validates the event name', function () {
      expect(query.fakeEvent.bind(query, 'bad')).to.throw();
    });

    it('fires the matched event with a snapshot', function () {
      var added = sinon.spy();
      var snapshot = {};
      var context = {};
      var removed = sinon.spy();
      query.on('child_added', added, void 0, context);
      query.on('child_removed', removed);
      query.fakeEvent('child_added', snapshot);
      expect(added)
        .to.have.been.calledWith(snapshot)
        .and.calledOn(context);
      expect(removed.called).to.equal(false);
    });
  });

  describe('on', function() {

    it('validates the event name', function () {
      expect(query.on.bind(query, 'bad')).to.throw();
    });

    describe('value', function() {
      it('should provide value immediately', function() {
        var spy = sinon.spy();
        ref.limit(2).on('value', spy);
        ref.flush();
        expect(spy.called).to.equal(true);
      });

      it('should return null if nothing in range exists', function() {
        var spy = sinon.spy(function(snap) {
          expect(snap.val()).equals(null);
        });
        ref.limit(2).startAt('foo').endAt('foo').on('value', spy);
        ref.flush();
        expect(spy.called).to.equal(true);
      });

      it('should return correct keys', function() {
        var spy = sinon.spy(function(snap) {
          expect(_.keys(snap.val())).eql(['num_3', 'char_a_1', 'char_a_2']);
        });
        ref.startAt(3).endAt('a').on('value', spy);
        ref.flush();
        expect(spy.called).to.equal(true);
      });

      it('should update on change', function() {
        var spy = sinon.spy();
        ref.startAt(3, 'num_3').limit(2).on('value', spy);
        ref.flush();
        expect(spy).callCount(1);
        ref.child('num_3').set({foo: 'bar'});
        ref.flush();
        expect(spy).callCount(2);
      });

      it('should not update on change outside range', function() {
        var spy = sinon.spy();
        ref.limit(1).on('value', spy);
        ref.flush();
        expect(spy).callCount(1);
        ref.child('num_3').set('apple');
        ref.flush();
        expect(spy).callCount(1);
      });

      it('can take the context as the 3rd argument', function () {
        var spy = sinon.spy();
        var context = {};
        ref.limit(1).on('value', spy, context);
        ref.flush();
        expect(spy).to.have.been.calledOn(context);
      });
    });

    describe('once', function() {

      it('validates the event name', function () {
        expect(query.once.bind(query, 'bad')).to.throw();
      });

      it('should be triggered if value is null', function() {
        var spy = sinon.spy();
        ref.child('notavalidkey').limit(3).once('value', spy);
        ref.flush();
        expect(spy).callCount(1);
      });

      it('should be triggered if value is not null', function() {
        var spy = sinon.spy();
        ref.limit(3).once('value', spy);
        ref.flush();
        expect(spy).callCount(1);
      });

      it('should not get triggered twice', function() {
        var spy = sinon.spy();
        ref.limit(3).once('value', spy);
        ref.flush();
        ref.child('addfortest').set({hello: 'world'});
        ref.flush();
        expect(spy).callCount(1);
      });
    });

    describe('child_added', function() {
      it('should include prevChild');

      it('should trigger all keys in initial range', function() {
        var spy = sinon.spy();
        var query = ref.limit(4);
        var data = query.slice().data;
        query.on('child_added', spy);
        query.flush();
        expect(spy).callCount(4);
        _.each(_.keys(data), function(k, i) {
          expect(spy.getCall(i).args[0].key()).equals(k);
        });
      });

      it('should notify on a new added event after init');

      it('should not notify for add outside range');

      it('should trigger a child_removed if using limit');

      it('should work if connected from instead a once "value"', function() {
        var ref = new Firebase('testing://');
        ref.autoFlush();
        ref.child('fruit').push('apples');
        ref.child('fruit').push('oranges');

        var third_value = 'pear';
        var model = {};
        var last_key = null;
        ref.child('fruit').once('value', function(list_snapshot) {
          list_snapshot.forEach(function(snapshot){
            model[snapshot.key()] = snapshot.val();
            snapshot.ref.on('value', function(snapshot) {
              model[snapshot.key()] = snapshot.val();
            });
            last_key = snapshot.key();
          });

          ref.child('fruit').startAt(null, last_key).on('child_added', function(snapshot) {
            if(model[snapshot.key()] === undefined)
            {
              model[snapshot.key()] = snapshot.val();
              snapshot.ref.on('value', function(snapshot) {
                model[snapshot.key()] = snapshot.val();
              });
            }
          }, undefined, this);
        }, undefined, this);

        var third_ref = ref.child('fruit').push(third_value);

        expect(model[third_ref.key()]).to.equal(third_value);

      });
    });

    describe('child_changed', function() {
      it('should trigger for a key in range');

      it('should not trigger for a key outside of range');
    });

    describe('child_removed', function() {
      it('should trigger for a child in range');

      it('should not trigger for a child out of range');

      it('should trigger a child_added for replacement if using limit');
    });

    describe('child_moved', function() {
      it('should trigger if item in range moves in range');

      it('should trigger child_removed if goes out of range');

      it('should trigger child_added if moved in range');
    });
  });

  describe('off', function() {
    it('should not notify on callbacks');
  });

  describe('limit', function() {
    it('should throw Error if non-integer argument');

    it('should return correct number of results');

    it('should work if does not match any results');

    it('should be relevant to endAt()'); //todo not implemented

    it('should be relevant to startAt()'); //todo not implemented
  });

  describe('endAt', function() {
    it('should make limit relative to the end of data');

    it('should stop at the priority given');

    it('should stop at the key given');

    it('should stop at the key+priority given');
  });

  describe('startAt', function() {
    it('should make limit relative to start of data');

    it('should start at the priority given');

    it('should start at the key given');

    it('should start at the key+priority given');
  });
});
