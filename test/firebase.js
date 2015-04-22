'use strict'

import test from 'tape'
import startsWith from 'core-js/fn/string/starts-with'
import Firebase from '../'

test('Constructor', (t) => {
  let ref = new Firebase()
  t.test('path defaults', (t) => {
    t.ok(startsWith(ref.path, 'mock://'), 'uses mock protocol')
    t.notEqual(ref.path, new Firebase().path, 'randomizes host')
    t.end()
  })
  t.end()
})
