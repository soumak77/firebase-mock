'use strict'

import test from 'tape'
import startsWith from 'core-js/fn/string/starts-with'
import Firebase from '../'

test('Firebase', (t) => {
  t.test('Constructor', (t) => {
    t.ok(startsWith(new Firebase().endpoint, 'mock://'), 'defaults to mock protocol')
    t.skip('caching', (t) => {
      t.notEqual(new Firebase('mock://'), new Firebase('mock://'), 'disabled by default')
      Firebase.cache.enable()
      t.equal(new Firebase('mock://', new Firebase('mock://')), 'can cache roots')
      Firebase.cache.disable()
      t.end()
    })
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
  t.end()
})
