'use strict'

import define from 'define-properties'

export default class ListenerSet {
  constructor () {
    define(this, {listeners: new Set()})
  }
  add (path, event, callback, cancel, context) {
    const listener = new Listener(path, event, callback, cancel, context)
    this.listeners.add(listener)
    return listener
  }
  delete (listener) {
    listener.deleted = true
    this.listeners.delete(listener)
  }
  deleteWhere (path, event, callback, context) {
    for (let listener of this.listeners) {
      if (path !== listener.path) continue
      if (event) {
        if (event !== listener.event) continue
        if (callback && callback !== listener.callback) continue
        if (arguments.length === 3 && context !== listener.context) continue
      }
      this.delete(listener)
    }
  }
  has (listener) {
    return this.listeners.has(listener)
  }
  forEach () {
    return this.listeners.forEach.apply(this.listeners, arguments)
  }
}

class Listener {
  constructor (path, event, callback, cancel, context) {
    if (typeof cancel !== 'function') {
      cancel = noop
      context = cancel
    }
    Object.assign(this, {path, event, callback, cancel, context})
  }
  call () {
    if (this.deleted) return
    this.callback.apply(this.context, arguments)
  }
  get initial () {
    return this.event === 'value' || this.event === 'child_added'
  }
}

function noop () {}
