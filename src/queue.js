'use strict'

export default class FlushQueue extends Set {
  constructor () {
    super()
    this.flushing = false
  }
  flush () {
    if (this.flushing) return
    if (!this.size) {
      throw new Error('No deferred tasks to be flushed')
    }
    this.flushing = true
    for (let fn of this) {
      fn()
    }
    this.clear()
    this.flushing = false
  }
}
