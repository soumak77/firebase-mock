'use strict'

import Queue from 'flush-queue'
import define from 'define-properties'
import DataMap from './map'
import PriorityMap from './priority'
import Cache from './cache'
import Listeners from './listeners'
import dispatch from './dispatch'

export default class Store {
  static cache = new Cache()
  constructor (endpoint) {
    const {cache} = this.constructor
    const cached = cache.get(endpoint)
    if (cached) return cached
    this.queue = new Queue()
    this.data = new DataMap()
    this.priority = new PriorityMap()
    this.listeners = new Listeners()
    cache.set(endpoint, this)
  }
  setData (root, data) {
    const diff = this.data.diff(data)
    this.data = data
    dispatch(root, this.listeners, diff)
  }
  setPriority (root, priority) {
    this.priority = priority
  }
}
