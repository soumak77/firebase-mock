'use strict'

import {join, resolve} from 'path-posix'
import assert from 'assert'
import last from 'array-last'
import {ServerValue} from 'firebase-server-value'
import define from 'define-properties'
import underscore from 'underscore-keys'
import Store from './store'
import Snapshot from './snapshot'
import Map from './map'
import {parse as parseUrl, format as formatUrl} from 'firebase-url'

export default class MockFirebase {
  static cache = Store.cache
  static ServerValue = ServerValue
  constructor (url, root) {
    assert(url, 'url is required')
    Object.assign(this, parseUrl(url))
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
    return this.store.data.toJSIn(this.keyPath)
  }
  getPriority () {
    return this.store.priority.get(this.keyPath)
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
        this.store.data.setIn(this.keyPath, Map.fromJS(data))
      )
    })
  }
  setPriority (priority) {
    this.defer(() => {
      this.store.setPriority(
        this.root(),
        this.store.priority.set(this.keyPath, priority)
      )
    })
  }
}
