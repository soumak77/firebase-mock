'use strict'

import test from 'tape'
import {spy} from 'sinon'
import startsWith from 'core-js/fn/string/starts-with'
import {fromJS as toImmutable} from 'immutable'
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
  t.test('set', (t) => {
    const ref = new Firebase()
    const listener = spy()
    ref.set({foo: 'bar'})
    ref.on('value', listener)
    t.equal(ref.getData(), null, 'deferred')
    ref.flush()
    t.deepEqual(ref.getData(), {foo: 'bar'}, 'sets data')
    t.equal(listener.callCount, 1)
    t.deepEqual(listener.firstCall.args[0].val(), {foo: 'bar'}, 'calls listener with snapshot')
    t.end()
  })
  t.end()
})
