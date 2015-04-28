'use strict'

import test from 'tape'
import {useFakeTimers} from 'sinon'
import Clock from '../src/clock'

test('Clock', (t) => {
  const timers = useFakeTimers()
  const clock = new Clock()
  t.equal(clock.time(), new Date().getTime())
  clock.set(() => 42)
  t.equal(clock.time(), 42)
  clock.restore()
  t.equal(clock.time(), new Date().getTime())
  timers.restore()
  t.end()
})
