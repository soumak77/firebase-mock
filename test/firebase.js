'use strict'

import test from 'tape'
import startsWith from 'core-js/fn/string/starts-with'
import {fromJS as toImmutable} from 'immutable'
import Firebase from '../'

test.only('Firebase', (t) => {
  t.test('Constructor', (t) => {
    t.ok(startsWith(new Firebase().endpoint, 'mock://'), 'defaults to mock protocol')
    t.skip('caching', (t) => {
      t.notEqual(new Firebase('mock://'), new Firebase('mock://'), 'disabled by default')
      Firebase.cache.enable()
      t.equal(new Firebase('mock://', new Firebase('mock://')), 'can cache roots')
      Firebase.cache.disable()
      t.end()
    })
    t.equal(new Firebase().priority, null)
    t.end()
  })
  t.test('getData', (t) => {
    t.equal(new Firebase().getData(), null, 'null by default')
    let ref = new Firebase()
    ref.data = toImmutable({foo: 'bar'})
    t.deepEqual(ref.getData(), {foo: 'bar'})
    ref = new Firebase('mock:///foo/bar')
    ref.root().data = toImmutable({foo: {bar: 0}})
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
    t.equal(new Firebase('m://').toString(), 'm://')
    t.end()
  })
  t.end()
})
