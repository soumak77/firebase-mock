'use strict'

import Queue from 'flush-queue'
import define from 'define-properties'
import {Map} from './map'
import Cache from './cache'
import Listeners from './listeners'
import dispatch from './dispatch'
import * as map from './map'

export default class Store {
  static cache = new Cache()
  constructor (endpoint) {
    const {cache} = this.constructor
    const cached = cache.get(endpoint)
    if (cached) return cached
    this.queue = new Queue()
    this.data = new Map()
    this.listeners = new Listeners()
    cache.set(endpoint, this)
  }
  setData (root, data) {
    const diff = map.diff(this.data, data)
    this.data = data
    dispatch(root, this.listeners, diff)
  }
}
