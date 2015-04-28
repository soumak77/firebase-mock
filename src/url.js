'use strict'

import cuid from 'cuid'
import {parse as parseUrl} from 'url'
import stripTrailingSlash from 'remove-trailing-slash'

export function random () {
  return `mock://${cuid()}`
}

export function parse (url) {
  const parsed = parseUrl(url)
  const endpoint = `${parsed.protocol}//${parsed.host}`
  const path = stripTrailingSlash(parsed.path || '')
  return {
    endpoint,
    path,
    isRoot: path === '',
    url: endpoint + path
  }
}
