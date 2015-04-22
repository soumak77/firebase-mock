'use strict'

import {random as randomUrl, parse as parseUrl} from './url'
import RefCache from './cache'

const cache = ((cache) => {
  return {
    get (url) {
      const {endpoint} = parseUrl(url)
      return cache.get(endpoint)
    },
    put (ref) {
      const {endpoint} = parseUrl(ref.url)
      cache.set(endpoint, ref)
      return ref
    }
  }
})(new RefCache())

export default class MockFirebase {
  constructor (url = randomUrl(), parent) {
    const cached = cache.get(url) // eslint-disable-line no-undef
    if (cached) {
      return cached
    } else {
      this.url = url // eslint-disable-line no-undef
      cache.put(this)
    }
    this._parent = parent
  }
}
