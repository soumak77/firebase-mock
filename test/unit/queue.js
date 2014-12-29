'use strict';

var expect = require('chai').use(require('sinon-chai')).expect;
var sinon  = require('sinon');
var Queue  = require('../../src/queue');

describe('FlushQueue', function () {

  var queue;
  beforeEach(function () {
    queue = new Queue();
  });

  it('constructs an empty event queue', function () {
    expect(queue)
      .to.have.property('events')
      .that.is.an('array')
      .that.is.empty;
  });

  describe('#push', function () {
    it('pushes events onto the queue', function () {
      var e = {};
      queue.push(e);
      expect(queue.getEvents())
        .to.have.length(1);
    });

    it('stores sourceData', function() {
      var srcDat = {foo: 'bar'};
      queue.push(function() {}, null, srcDat);
      expect(queue.getEvents()[0].sourceData).to.eql(srcDat);
    });
  });

  describe('#flush', function () {

    it('is throws when there are no deferreds', function () {
      expect(queue.flush.bind(queue)).to.throw('No deferred');
    });

    it('fires the events synchronously by default', function () {
      var spy = sinon.spy();
      queue.push(spy);
      queue.flush();
      expect(spy).to.have.been.called;
    });

    it('empties the queue before invoking events', function () {
      var spy = sinon.spy(function() {
        expect(queue.events).to.be.empty;
      });
      queue.push(spy);
      queue.flush();
      expect(spy).to.have.been.called;
    });

    it('can invoke events after a delay', function () {
      var clock = sinon.useFakeTimers();
      var spy = sinon.spy();
      queue.push(spy);
      queue.flush(100);
      expect(spy).to.not.have.been.called;
      clock.tick(100);
      expect(spy).to.have.been.called;
    });

    it('runs events in the correct context', function() {
      var ctx = {};
      var spy = sinon.spy(function assertEmpty () {
        expect(this).to.equal(ctx);
      });
      queue.push(spy, ctx);
      queue.flush();
      expect(spy).to.have.been.called;
    });

    it('does not not run any canceled events', function() {
      var spy1 = sinon.spy();
      var spy2 = sinon.spy();
      queue.push(spy1);
      queue.push(spy2);
      queue.getEvents()[0].cancel();
      queue.flush();
      expect(spy1).not.to.have.been.called;
      expect(spy2).to.have.been.called;
    });

    it('does not run any events twice', function() {
      var spy1 = sinon.spy();
      var spy2 = sinon.spy();
      queue.push(spy1);
      queue.push(spy2);
      queue.getEvents()[0].run();
      queue.flush();
      expect(spy1).to.have.been.calledOnce;
      expect(spy2).to.have.been.calledOnce;
    });
  });

  describe('#getEvents', function() {
    it('should return an array equal to number of events in queue', function() {
      queue.push(function() {});
      queue.push(function() {});
      var events = queue.getEvents();
      expect(events.length).to.equal(2);
    });

    it('should return a copy and not the original list', function() {
      queue.push(function() {});
      var list = queue.getEvents();
      expect(list).to.eql(queue.events);
      expect(list).not.to.equal(queue.events);
    });
  });

});