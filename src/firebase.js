'use strict'

export default class MockFirebase {
  constructor (path = 'Mock://', parent) {
    this.path = path //eslint-disable-line no-undef
    this._parent = parent
  }
}
