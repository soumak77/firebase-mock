'use strict'

import Clock from 'clockwise'
import {sv as sv1} from 'value-to-firebase'
import {sv as sv2} from 'object-to-firebase'

const clock = new Clock()

;[sv1, sv2]
  .map(sv => sv.values)
  .forEach(values => values.timestamp = clock.time.bind(clock))

export default clock
