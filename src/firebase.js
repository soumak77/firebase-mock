'use strict'

import {random as randomUrl} from './url'

export default class MockFirebase {
  constructor (url = randomUrl(), parent) {
    this.url = url //eslint-disable-line no-undef
    this._parent = parent
  }
}
