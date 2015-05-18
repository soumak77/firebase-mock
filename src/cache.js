'use strict'

export default class RefCache {
  constructor () {
    this.store = new Map()
    this.disable()
  }
  enable () {
    this.enabled = true
  }
  disable () {
    this.enabled = false
  }
  clear () {
    for (let key of this.store.keys()) {
      this.store.delete(key)
    }
  }
  get () {
    if (!this.enabled) return
    return this.store.get(...arguments)
  }
  set () {
    if (!this.enabled) return this
    return this.store.set(...arguments)
  }
  get size () {
    return this.store.size
  }
}
