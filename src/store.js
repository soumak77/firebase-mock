'use strict'

import Map from './map'

export default class Store {
  constructor (endpoint) {
    const {cache} = this.constructor
    const cached = cache.get(endpoint)
    if (cached) return cached
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
  static setCache (cache) {
    this.cache = cache
  }
}
