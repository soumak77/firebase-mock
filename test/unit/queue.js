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
      expect(queue.events)
        .to.have.length(1)
        .and.property(0, e);
    });

  });

  describe('#flush', function () {

    it('is a noop with no events', function () {
      queue.flush();
    });

    it('fires the events synchoronously by default', function () {
      var spy = sinon.spy();
      queue.push([spy, 1, 2]);
      queue.flush();
      expect(spy).to.have.been.calledWith(1, 2);
    });

    it('empties the queue before invoking events', function () {
      function assertEmpty () {
        expect(queue.events).to.be.empty;
      }
      queue.push([assertEmpty]);
      queue.flush();
    });

    it('can invoke events after a delay', function () {
      var clock = sinon.useFakeTimers();
      var spy = sinon.spy();
      queue.push([spy]);
      queue.flush(100);
      expect(spy).to.not.have.been.called;
      clock.tick(100);
      expect(spy).to.have.been.called;
    });

  });

});
