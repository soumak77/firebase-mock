'use strict'

export default class RefCache extends Map {
  constructor () {
    super()
    this.disable()
  }
  enable () {
    this.enabled = true
  }
  disable () {
    this.enabled = false
  }
  clear () {
    for (let key of this.keys()) {
      this.delete(key)
    }
  }
  get () {
    if (!this.enabled) return
    return super.get(...arguments)
  }
  set () {
    if (!this.enabled) return this
    return super.set(...arguments)
  }
}
