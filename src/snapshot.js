'use strict'

import exportValue from 'firebase-export-value'
import isEmpty from 'is-empty-object'
import underscore from 'underscore-keys'
import {unary} from 'nary'

export default class Snapshot {
  constructor (ref, data, priority) {
    Object.assign(this, underscore({ref, data, priority}))
  }
  child (key) {
    const ref = this.ref().child(key)
    const data = this.hasChild(key) ? this.val()[key] : null
    const priority = this.ref().child(key).priority
    return new this.constructor(ref, data, priority)
  }
  exists () {
    return this.val() !== null
  }
  exportVal () {
    function params (snapshot) {
      return [snapshot.val(), snapshot.getPriority(), child.bind(snapshot)]
    }
    function child (key) {
      const snapshot = this.child(key)
      return [...params(snapshot)]
    }
    return exportValue(...params(this))
  }
  forEach (callback, context) {
    Object.keys(this.val())
      .map(unary(this.child), this)
      .forEach(unary(callback), context)
  }
  getPriority () {
    return this._priority
  }
  hasChild (key) {
    return !!(this.val() && this.val()[key])
  }
  hasChildren () {
    return !!this.numChildren()
  }
  key () {
    return this.ref().key()
  }
  numChildren () {
    const data = this.val()
    return data ? Object.keys(data).length : 0
  }
  ref () {
    return this._ref
  }
  val () {
    return this._data
  }
}
