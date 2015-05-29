'use strict'

import {Map, List} from 'immutable'

export default class PriorityMap {
  constructor (map = new Map()) {
    this.map = map // eslint-disable-line no-undef
  }
  get (keyPath) {
    keyPath = List.of(...keyPath)
    return this.map.get(keyPath, null)
  }
  set (keyPath, priority) {
    keyPath = List.of(...keyPath)
    const updated = this.map.set(keyPath, priority)
    return updated === this.map ? this : new this.constructor(updated)
  }
}
