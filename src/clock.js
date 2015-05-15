'use strict'

import Clock from 'clockwise'
import {sv1} from 'value-to-firebase'
import {sv2} from 'object-to-firebase'

const clock = new Clock()

;[sv1, sv2]
  .map(sv => sv.values)
  .forEach(values => values.timestamp = ::clock.time)

export default clock
