'use strict'

import {EventEmitter} from 'events'

class FlushQueue {
  constructor () {
    this.events = new Set()
    this.flushing = false
  }
  add (event) {
    let {fn, context, sourceData} = event;
    event = new FlushEvent(fn, context, sourceData)
      .once('done', (event) => {
        this.events.delete(event)
      })
    this.events.add(event)
    return this
  }
  flush () {
    if (this.flushing) return
    if (!this.events.size) {
      throw new Error('No deferred tasks to be flushed')
    }
    this.flushing = true
    for (let event of this.events) event.run()
    this.flushing = false
  }
  getEvents () {
    return [...this.events]
  }
}

class FlushEvent extends EventEmitter {
  constructor (fn, context, sourceData) {
    super()
    Object.assign(this, {fn, context, sourceData})
  }
  run () {
    this.fn.call(this.context)
    this.emit('done', this)
  }
  cancel () {
    this.emit('done', this)
  }
}

export {FlushQueue as Queue, FlushEvent as Event}
