'use strict'

import test from 'tape'
import {spy} from 'sinon'
import {Queue, Event} from '../src/queue'

test('FlushQueue', (t) => {
  const queue = new Queue()
  t.equal(queue.events.size, 0, 'initially empty')
  t.equal(queue.add({}).events.size, 1, 'can add events')
  t.test('flush', (t) => {
    queue.events.clear()
    t.throws(queue.flush.bind(queue), 'No deferred', 'throws when empty')
    const fn = spy()
    queue.add({fn})
    queue.flush()
    t.ok(fn.called, 'fires events synchronously')
    t.equal(queue.events.size, 0, 'clears itself when run')
    fn.reset()
    queue.add({fn: () => {
      queue.add({fn: fn}) // can't be destructured (output becomes circular)
    }})
    queue.flush()
    t.ok(fn.called, 'fires events added during processing')
    queue.add({fn: () => {
      queue.flush()
    }})
    queue.flush()
    t.pass('prevents recursive flush')
    t.end()
  })
  t.test('getEvents', (t) => {
    queue.events.clear()
    const fn = spy()
    queue.add({fn})
    const events = queue.getEvents()
    t.equal(events[0].fn, fn, 'gets events')
    t.end()
  })
  t.end()
})

test('FlushEvent', (t) => {
  const fn = spy()
  const context = {}
  const event = new Event(fn, context)
  t.test('run', (t) => {
    event.run()
    t.equal(fn.firstCall.thisValue, context, 'calls on context')
    const listener = spy()
    event.on('done', listener)
    event.run()
    t.ok(listener.called, 'emits "done" event')
    t.end()
  })
  t.test('cancel', (t) => {
    const listener = spy()
    event.on('done', listener)
    event.cancel()
    t.ok(listener.called, 'emits "done" event')
    t.end()
  })
  t.end()
})
