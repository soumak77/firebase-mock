'use strict'

import test from 'tape'
import {spy} from 'sinon'
import startsWith from 'core-js/fn/string/starts-with'
import Firebase from '../'

test('Firebase', (t) => {
  t.test('Constructor', (t) => {
    t.ok(startsWith(new Firebase().endpoint, 'mock://'), 'defaults to mock protocol')
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
    t.equal(new Firebase().getData(), null, 'null by default')
    let ref = new Firebase()
    ref.data = ref.data.merge({foo: 'bar'})
    t.deepEqual(ref.getData(), {foo: 'bar'})
    ref = new Firebase('mock:///foo/bar')
    ref.root().data = ref.root().data.mergeDeep({foo: {bar: 0}})
    t.deepEqual(ref.getData(), 0)
    t.equal(ref.child('baz').getData(), null)
    t.end()
  })
  t.test('parent', (t) => {
    t.equal(new Firebase().parent(), null)
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
    const ref = new Firebase()
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
    const ref = new Firebase()
    const callback = spy()
    t.equal(ref.once('value', callback), callback, 'returns callback')
    ref.flush()
    ref.set('foo')
    ref.flush()
    t.equal(callback.callCount, 1, 'only called once')
    t.end()
  })
  t.test('set', (t) => {
    const ref = new Firebase()
    ref.set('foo')
    t.equal(ref.getData(), null, 'deferred')
    ref.flush()
    t.equal(ref.getData(), 'foo', 'sets data')
    t.end()
  })
  t.end()
})
