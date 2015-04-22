'use strict'

import cuid from 'cuid'

export function random () {
  return `mock://${cuid()}`
}
