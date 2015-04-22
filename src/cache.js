'use strict'

class EndpointMap extends Map {
  add (endpoint) {
    const key = {endpoint}
    this.set(endpoint, key)
    return key
  }
}

export default class RefCache extends WeakMap {
  constructor (...args) {
    super(...args)
    this.endpoints = new EndpointMap()
  }
  get (endpoint) {
    const key = this.endpoints.get(endpoint)
    if (!key) return
    return super.get(key)
  }
  set (endpoint, ref) {
    const key = this.endpoints.add(endpoint)
    return super.set(key, ref)
  }
}
