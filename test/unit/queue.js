'use strict';

var expect       = require('chai').use(require('sinon-chai')).expect;
var sinon        = require('sinon');
var _            = require('lodash');
var Queue        = require('../../src/queue').Queue;
var FlushEvent   = require('../../src/queue').Event;
var EventEmitter = require('events').EventEmitter;

describe('FlushQueue', function () {

  var queue, spy;
  beforeEach(function () {
    queue = new Queue();
    spy = sinon.spy();
  });

  it('constructs an empty event queue', function () {
    expect(queue)
      .to.have.property('events')
      .that.is.an('array')
      .that.is.empty;
  });

  it('removes events when they are cancelled', function () {
    queue.push(_.noop);
    queue.getEvents()[0].cancel();
    expect(queue.getEvents()).to.have.length(0);
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
      queue.push(spy);
      queue.flush();
      expect(spy).to.have.been.called;
    });

    it('fires events added during queue processing', function () {
      queue.push(function () {
        queue.push(spy);
      });
      queue.flush();
      expect(spy).to.have.been.called;
    });

    it('can invoke events after a delay', function () {
      var clock = sinon.useFakeTimers();
      queue.push(spy);
      queue.flush(100);
      expect(spy).to.not.have.been.called;
      clock.tick(100);
      expect(spy).to.have.been.called;
    });

    it('removes internal event listeners immediately', function () {
      queue.push(_.noop);
      var event = queue.getEvents()[0];
      queue.flush();
      expect(EventEmitter.listenerCount(event, 'cancel')).to.equal(0);
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

    it('runs the event handler on the context', function () {
      event.run();
      expect(spy).to.have.been.calledOn(context);
    });

    it('emits a done event', function () {
      spy = sinon.spy();
      event.on('done', spy);
      event.run();
      expect(spy).to.have.been.called;
    });

  });

  describe('#cancel', function () {

    it('emits a done event', function () {
      spy = sinon.spy();
      event.on('done', spy);
      event.cancel();
      expect(spy).to.have.been.called;
    });

  });

});
