'use strict'

export default class MockFirebase {
  constructor (path, parent) {
    path = this.path = path || 'Mock://'
    // ^ temp until https://github.com/eslint/eslint/issues/2345
    this._parent = parent
  }
}
