'use strict'

import cuid from 'cuid'
import {parse as parseUrl} from 'url'
import normalize from 'normalize-pathname'

export function random () {
  return `mock://${cuid()}`
}

export function parse (url) {
  const parsed = parseUrl(url)
  const endpoint = `${parsed.protocol}//${parsed.host}`
  const path = normalize(parsed.path || '') || '/'
  return {
    endpoint,
    path,
    isRoot: path === '/',
    url: endpoint + path
  }
}

export function format ({endpoint, path}) {
  return endpoint + normalize(path)
}
