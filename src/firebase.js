'use strict'

import {resolve as resolveUrl} from 'url'
import {posix as posixPath} from 'path'
import assert from 'assert'
import Cache from './cache'
import {random as randomEndpoint, parse as parseUrl} from './url'

const {join, resolve} = posixPath

export default class MockFirebase {
  static cache = new Cache()
  constructor (url = randomEndpoint(), root) {
    Object.assign(this, parseUrl(url)) // eslint-disable-line no-undef
    if (this.isRoot) {
      const cache = this.constructor.cache
      const cached = cache.get(this.endpoint)
      if (cached) return cached
      cache.set(this.endpoint, this)
    } else {
      this._root = root || new this.constructor(this.endpoint)
    }
  }
  parent () {
    const parentUrl = this.endpoint + resolve(this.path, '..')
    return this.isRoot ? null : new this.constructor(parentUrl, this.root())
  }
  root () {
    return this.isRoot ? this : this._root
  }
  child (path) {
    assert(path && typeof path === 'string', '"path" must be a string')
    if (path.charAt(0) !== '/') path = '/' + path
    const url = this.endpoint + join(this.path, path)
    return new this.constructor(url, this.root())
  }
}
