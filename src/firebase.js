'use strict'

import {resolve as resolveUrl} from 'url'
import {posix as posixPath} from 'path'
import assert from 'assert'
import {Queue} from './queue'
import Cache from './cache'
import Clock from './clock'
import {random as randomEndpoint, parse as parseUrl} from './url'

const {join, resolve} = posixPath

export default class MockFirebase {
  static cache = new Cache()
  static clock = new Clock()
  static ServerValue = {
    TIMESTAMP: {
      '.sv': 'timestamp'
    }
  }
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
    this.queue = this.isRoot ? new Queue() : this.root().queue
  }
  flush () {
    this.queue.flush()
    return this
  }
  getFlushQueue () {
    return this.queue.getEvents()
  }
  parent () {
    const parentUrl = this.endpoint + resolve(this.path, '..')
    return this.isRoot ? null : new this.constructor(parentUrl, this.root())
  }
  ref () {
    return this
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
  key () {
    const parts = this.path.split('/')
    return parts[parts.length - 1] || null
  }
}
