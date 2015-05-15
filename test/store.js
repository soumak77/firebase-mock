'use strict'

import test from 'tape'
import Store from '../src/store'
import Cache from '../src/cache'

test('Store', (t) => {
  Store.cache.clear()
  Store.cache.enable()
  t.equal(new Store('e'), new Store('e'), 'cached')
  t.test('proxy', (t) => {
    const destination = {}
    const store = new Store().proxy(destination)
    t.equal(destination.data, store.data, 'creates getters')
    destination.data = 'foo'
    t.equal(store.data, 'foo', 'creates setters')
    t.end()
  })
  t.end()
})
