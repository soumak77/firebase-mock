'use strict'

import {Map} from 'immutable'
import diff from 'immutablediff'

export default class FirebaseMap extends Map {
  toJS () {
    return this.size ? super.toJS() : null
  }
  diff (value) {
    return diff(this, value)
  }
}
