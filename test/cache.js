'use strict'

import test from 'tape'
import Cache from '../src/cache'

test('Reference Cache', (t) => {
  const cache = new Cache()
  t.notOk(cache.enabled, 'disabled by default')
  cache.enable()
  t.ok(cache.enabled, 'can be enabled')
  cache.set('foo', 1)
  t.equal(cache.get('foo'), 1, 'can add and retrieve items')
  cache.disable()
  t.notOk(cache.get('foo'), 'gets undefined when disabled')
  cache.set('bar', 2)
  cache.enable()
  t.notOk(cache.get('bar'), 'no sets when disabled')
  cache.clear()
  t.equal(cache.size, 0, 'can be cleared')
  t.end()
})
