'use strict'

import exportValue from 'firebase-export-value'
import isEmpty from 'is-empty-object'
import define from 'define-properties'
import {join} from 'path'
import underscore from 'underscore-keys'
import * as map from './map'

export default class Snapshot {
  constructor (ref, root) {
    if (!root) {
      root = this
      define(this, {data: ref.store.data})
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
    return map.toJSIn(this.root.data, this.ref().keyPath)
  }
}
