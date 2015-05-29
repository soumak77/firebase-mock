'use strict'

import test from 'tape'
import {stub, spy} from 'sinon'
import Snapshot from '../src/snapshot'
import Firebase from '../'

test('Snapshot', (t) => {
  function createRef () {
    return new Firebase('mock://')
  }
  t.test('exists', (t) => {
    const ref = createRef()
    t.notOk(new Snapshot(ref).exists())
    ref.set(1)
    ref.flush()
    t.ok(new Snapshot(ref).exists())
    t.end()
  })
  t.test('exportVal', (t) => {
    const ref = createRef()
    function exportVal () {
      return new Snapshot(ref).exportVal()
    }
    ref.set(1)
    ref.flush()
    t.equal(exportVal(), 1)
    ref.setPriority(2)
    ref.flush()
    t.deepEqual(exportVal(), {'.priority': 2, '.value': 1})
    ref.set({foo: 'bar'})
    ref.flush()
    t.deepEqual(exportVal(), {'.priority': 2, foo: 'bar'})
    ref.set({foo: {bar: 'baz'}})
    ref.child('foo').setPriority(3)
    ref.flush()
    t.deepEqual(exportVal(), {
      '.priority': 2,
      foo: {
        '.priority': 3,
        bar: 'baz'
      }
    })
    t.end()
  })
  t.test('forEach', (t) => {
    const ref = createRef()
    ref.set({foo: 'bar'})
    ref.flush()
    const snapshot = new Snapshot(ref)
    const callback = spy()
    const context = {}
    snapshot.forEach(callback, context)
    t.equal(callback.callCount, 1)
    const call = callback.firstCall
    t.equal(call.args.length, 1)
    const [child] = call.args
    t.ok(child instanceof Snapshot)
    t.equal(child.key(), 'foo')
    t.equal(call.thisValue, context)
    t.end()
  })
  t.test('hasChild', (t) => {
    const ref = createRef()
    t.notOk(new Snapshot(ref).hasChild('foo'))
    ref.set({foo: 'bar'})
    ref.flush()
    t.ok(new Snapshot(ref).hasChild('foo'))
    t.end()
  })
  t.test('hasChildren', (t) => {
    const ref = createRef()
    t.notOk(new Snapshot(ref).hasChildren())
    ref.set({foo: 'bar'})
    ref.flush()
    t.ok(new Snapshot(ref).hasChildren())
    t.end()
  })
  t.test('numChildren', (t) => {
    const ref = createRef()
    t.equal(new Snapshot(ref).numChildren(), 0)
    ref.set({foo: 'bar'})
    ref.flush()
    t.equal(new Snapshot(ref).numChildren(), 1)
    t.end()
  })
  t.end()
})
