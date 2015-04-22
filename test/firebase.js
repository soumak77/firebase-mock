'use strict'

import test from 'tape'
import startsWith from 'core-js/fn/string/starts-with'
import Firebase from '../'

test('Firebase', (t) => {
  t.test('Constructor', (t) => {
    let ref = new Firebase()
    t.test('url', (t) => {
      t.ok(startsWith(ref.url, 'mock://'), 'defaults to mock protocol')
      t.notEqual(ref.url, new Firebase().url, 'defaults to random host')
      t.end()
    })
    t.end()
  })
  t.end()
})
