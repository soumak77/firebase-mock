'use strict'

export default class MockFirebase {
  constructor (path = 'Mock://', parent) {
    this.path = path
    this._parent = parent
  }
}
