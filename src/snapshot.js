'use strict'

import exportValue from 'firebase-export-value'
import define from 'define-properties'
import {join} from 'path-posix'
import underscore from 'underscore-keys'
import Map from './map'

export default class Snapshot {
  constructor (ref, root) {
    if (!root) {
      root = this
      const {data, priority} = ref.store
      define(this, {data, priority})
    }
    define(this, underscore({ref}))
    define(this, {root})
  }
  child (path) {
    return new this.constructor(
      this.ref().child(path),
      this.root
    )
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
      .map(key => this.child(key))
      .forEach(child => callback.call(context, child))
  }
  getPriority () {
    return this.root.priority.get(this.ref().keyPath)
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
    return this.root.data.toJSIn(this.ref().keyPath)
  }
}
