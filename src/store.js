'use strict'

import Queue from 'flush-queue'
import Map from './map'
import Cache from './cache'

export default class Store {
  static cache = new Cache()
  constructor (endpoint) {
    const {cache} = this.constructor
    const cached = cache.get(endpoint)
    if (cached) return cached
    this.queue = new Queue()
    this.data = new Map()
    this.listeners = new Set()
    cache.set(endpoint, this)
  }
  proxy (destination) {
    Object.defineProperties(destination, Object.getOwnPropertyNames(this)
      .reduce((properties, property) => {
        properties[property] = {
          get: () => {
            return this[property]
          },
          set: (value) => {
            this[property] = value
          }
        }
        return properties
      }, {}))
    return this
  }
}
