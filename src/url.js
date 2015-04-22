'use strict'

import cuid from 'cuid'
import {parse as parseUrl} from 'url'

export function random () {
  return `mock://${cuid()}`
}

export function parse (url) {
  const parsed = parseUrl(url)
  return {
    endpoint: `${parsed.protocol}//${parsed.host}`,
    path: parsed.path
  }
}
