'use strict'

import test from 'tape'
import {spy} from 'sinon'
import startsWith from 'core-js/fn/string/starts-with'
import Firebase from '../'

test('Firebase', (t) => {
  t.test('Constructor', (t) => {
    t.throws(() => {return new Firebase()}, /url is required/)
    t.test('caching', (t) => {
      Firebase.cache.enable()
      const ref1 = new Firebase('mock://')
      const ref2 = new Firebase('mock://')
      t.equal(ref1.store, ref2.store, 'can cache root stores')
      t.notEqual(ref1, ref2, 'refs not strictly equal')
      Firebase.cache.disable()
      t.end()
    })
    t.end()
  })
  t.test('getData', (t) => {
    t.equal(createRef().getData(), null, 'null by default')
    let ref = createRef()
    ref.store.data = ref.store.data.merge({foo: 'bar'})
    t.deepEqual(ref.getData(), {foo: 'bar'})
    ref = new Firebase('mock:///foo/bar')
    ref.store.data = ref.store.data.mergeDeep({foo: {bar: 0}})
    t.deepEqual(ref.getData(), 0)
    t.equal(ref.child('baz').getData(), null)
    t.end()
  })
  t.test('parent', (t) => {
    t.equal(createRef().parent(), null)
    const child = new Firebase('parent:///path/foo')
    t.equal(child.parent().url, 'parent:///path')
    t.notEqual(child.parent(), child.parent(), 'nondeterministic')
    t.end()
  })
  t.test('child', (t) => {
    const parent = new Firebase('parent://')
    t.equal(parent.child('foo').url, 'parent:///foo')
    t.notEqual(parent.child('foo'), parent.child('foo'), 'nondeterministic')
    t.throws(parent.child.bind(parent), /must be a string/)
    t.end()
  })
  t.test('key', (t) => {
    t.equal(new Firebase('parent:///foo/bar').key(), 'bar')
    t.equal(new Firebase('parent://').key(), null)
    t.end()
  })
  t.test('toString', (t) => {
    t.equal(new Firebase('m:///').toString(), 'm:///')
    t.end()
  })
  t.test('on', (t) => {
    const ref = createRef()
    const callback = spy()
    t.equal(ref.on('value', callback), callback, 'returns callback')
    ref.flush()
    t.equal(callback.callCount, 1, 'called initially for value')
    t.equal(callback.firstCall.args[0].val(), null, 'called with initial data')
    ref.set('foo')
    ref.flush()
    t.equal(callback.callCount, 2, 'called with updates')
    t.equal(callback.secondCall.args[0].val(), 'foo', 'called with updated data')
    t.end()
  })
  t.test('once', (t) => {
    const ref = createRef()
    const callback = spy()
    t.equal(ref.once('value', callback), callback, 'returns callback')
    ref.flush()
    ref.set('foo')
    ref.flush()
    t.equal(callback.callCount, 1, 'only called once')
    t.end()
  })
  t.test('off', (t) => {
    const ref = createRef()
    const {listeners} = ref.store
    const child = ref.child('foo')
    const callback = function () {}
    const context = {}
    ref.on('value', callback)
    child.on('value', callback)
    t.equal(listeners.size, 2)
    ref.off()
    t.equal(listeners.size, 1, 'disable all at path')
    child.off('value')
    t.equal(listeners.size, 0, 'disable all for event')
    ref.on('child_added', callback)
    ref.off('child_added', function () {})
    t.equal(listeners.size, 1, 'filter by callback')
    ref.off('child_added', callback)
    t.equal(listeners.size, 0, 'filter by callback')
    ref.on('value', callback, context)
    t.equal(listeners.size, 1)
    ref.off('value', callback, {})
    t.equal(listeners.size, 1, 'filter by context')
    ref.off('value', callback, context)
    t.equal(listeners.size, 0, 'filter by context')
    t.end()
  })
  t.test('set', (t) => {
    const ref = createRef()
    ref.set('foo')
    t.equal(ref.getData(), null, 'deferred')
    ref.flush()
    t.equal(ref.getData(), 'foo', 'sets data')
    t.end()
  })
  t.end()
})

function createRef () {
  return new Firebase('mock://')
}
