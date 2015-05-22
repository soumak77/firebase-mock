'use strict'

import test from 'tape'
import Store from '../src/store'
import Cache from '../src/cache'

test('Store', (t) => {
  Store.cache.clear()
  Store.cache.enable()
  t.equal(new Store('e'), new Store('e'), 'cached')
  t.end()
})
