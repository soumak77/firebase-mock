'use strict'

import define from 'define-properties'
import {EventEmitter} from 'events'

export default class ListenerSet {
  constructor () {
    define(this, {listeners: new Set()})
  }
  add (path, event, callback, cancel, context) {
    const listener = new Listener(path, event, callback, cancel, context)
    this.listeners.add(listener)
    return listener
  }
  removed (listener) {
    listener.removed = true
    this.listeners.remove(listener)
  }
  removeWhere (path, event, callback, context) {
    for (let listener of this.listeners) {
      if (path !== listener.path) continue
      if (event) {
        if (event !== listener.event) continue
        if (callback && callback !== listener.callback) continue
        if (arguments.length === 3 && context !== listener.context) continue
      }
      this.remove(listener)
    }
  }
  has (listener) {
    return this.listeners.has(listener)
  }
  forEach () {
    return this.listeners.forEach.apply(this.listeners, arguments)
  }
}

class Listener extends EventEmitter {
  constructor (path, event, callback, cancel, context) {
    super()
    if (typeof cancel !== 'function') {
      cancel = noop
      context = cancel
    }
    Object.assign(this, {path, event, callback, cancel, context})
    this.initial = event === 'value' || event === 'child_added'
  }
  call () {
    if (this.removed) return
    this.emit('call', this)
    this.callback.apply(this.context, arguments)
  }
}

function noop () {}
