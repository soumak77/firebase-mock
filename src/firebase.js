'use strict'

import {posix as posixPath} from 'path'
import assert from 'assert'
import last from 'array-last'
import {ServerValue} from 'firebase-server-value'
import define from 'define-properties'
import underscore from 'underscore-keys'
import clock from './clock'
import Store from './store'
import Snapshot from './snapshot'
import * as map from './map'
import {random as randomEndpoint, parse as parseUrl, format as formatUrl} from './url'

const {join, resolve} = posixPath

export default class MockFirebase {
  static cache = Store.cache
  static clock = clock
  static ServerValue = ServerValue
  constructor (url = randomEndpoint(), root) {
    Object.assign(this, parseUrl(url)) // eslint-disable-line no-undef
    if (this.isRoot) {
      const store = new Store(this.endpoint)
      define(this, underscore({store}))
    } else {
      define(this, {_root: root || new this.constructor(this.endpoint)})
    }
  }
  flush () {
    this.store.queue.flush()
    return this
  }
  get keyPath () {
    return this.isRoot ? [] : this.path.split('/').slice(1)
  }
  getData () {
    return map.toJSIn(this.store.data, this.keyPath)
  }
  parent () {
    return this.isRoot ? null : new this.constructor(formatUrl({
      endpoint: this.endpoint,
      path: resolve(this.path, '..')
    }), this.root())
  }
  ref () {
    return this
  }
  root () {
    return this.isRoot ? this : this._root
  }
  get store () {
    return this.root()._store
  }
  child (path) {
    assert(path && typeof path === 'string', '"path" must be a string')
    if (path === '/') return this
    return new this.constructor(formatUrl({
      endpoint: this.endpoint,
      path: join(this.path, path)
    }), this.root())
  }
  key () {
    return last(this.path.split('/')) || null
  }
  toString () {
    return this.url
  }
  defer (callback) {
    this.store.queue.add(callback)
    return this
  }
  addListener (event, callback, cancel, context) {
    const listener = this.store.listeners.add(this.path, ...arguments)
    if (listener.initial) {
      this.defer(() => {
        listener.call(new Snapshot(this))
      })
    }
    return listener
  }
  on (event, callback, cancel, context) {
    return this.addListener(event, callback, cancel, context).callback
  }
  once (event, callback, cancel, context) {
    return this.addListener(event, callback, cancel, context)
      .on('call', (listener) => {
        this.store.listeners.remove(listener)
      })
      .callback
  }
  off (event, callback, context) {
    this.store.listeners.removeWhere(this.path, event, callback, context)
  }
  set (data) {
    this.defer(() => {
      this.store.setData(
        this.root(),
        this.store.data.setIn(this.keyPath, map.fromJS(data))
      )
    })
  }
}
