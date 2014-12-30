'use strict';

var expect     = require('chai').use(require('sinon-chai')).expect;
var sinon      = require('sinon');
var _          = require('lodash');
var Queue      = require('../../src/queue').Queue;
var FlushEvent = require('../../src/queue').Event;

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

    it('pushes simple events onto the queue like [].push', function () {
      queue.push(_.noop, _.noop);
      expect(queue.getEvents()).to.have.length(2);
    });

    it('pushes complex events', function () {
      var sourceData = {
        foo: 'bar'
      };
      queue.push({
        fn: _.noop,
        context: null,
        sourceData: sourceData
      });
      var event = queue.getEvents()[0];
      expect(event.sourceData).to.equal(sourceData);
      expect(event).to.be.an.instanceOf(FlushEvent);
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
      var spy = sinon.spy(function () {
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

    it('does not invoke events that have run', function () {
      var spy = sinon.spy();
      queue.push(spy);
      queue.getEvents()[0].run();
      spy.reset();
      queue.flush();
      expect(spy).to.not.have.been.called;
    });

  });

  describe('#getEvents', function() {

    it('returns a copy of the events', function () {
      queue.push(_.noop);
      expect(queue.getEvents()).to.deep.equal(queue.events);
      expect(queue.getEvents()).to.not.equal(queue.events);
    });

  });

});

describe('FlushEvent', function () {

  var spy, context, event;
  beforeEach(function () {
    spy = sinon.spy();
    context = {};
    event = new FlushEvent(spy, context);
  });

  describe('#run', function () {

    it('throws if called twice', function () {
      event.run();
      expect(function runEvent () {
        event.run();
      })
      .to.throw('multiple times');
    });

    it('is a noop if cancelled', function () {
      event.cancel();
      event.run();
      expect(event.hasRun).to.be.false;
    });

  });

  describe('#cancel', function () {

    it('throws if called after run', function () {
      event.run();
      expect(function cancelEvent () {
        event.cancel();
      })
      .to.throw('after event.run');
    });

  });

});