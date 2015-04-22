'use strict'

import test from 'tape'
import * as url from '../src/url'

test('parse', (t) => {
  const parsed = url.parse('mock://host/path')
  t.deepEqual(parsed, {
    endpoint: 'mock://host',
    path: '/path'
  }, 'parses to endpoint and path')
  t.end()
})
