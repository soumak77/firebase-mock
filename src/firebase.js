'use strict'

import * as url from './url'

export default class MockFirebase {
  constructor (path, parent) {
    this.path = url.random()
    this._parent = parent
  }
}
