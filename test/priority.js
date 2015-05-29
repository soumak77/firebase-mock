'use strict'

import test from 'tape'
import PriorityMap from '../src/priority'

test('PriorityMap', (t) => {
  let priority = new PriorityMap()
  t.equal(priority.get([]), null)
  t.notEqual(priority, priority.set(['foo'], 1))
  priority = priority.set(['foo'], 1)
  t.equal(priority.set(['foo'], 1), priority)
  t.equal(priority.get(['foo']), 1)
  t.end()
})
