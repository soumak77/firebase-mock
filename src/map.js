'use strict'

import {Map} from 'immutable'
import normalize from 'normalize-pathname'

export default class FirebaseMap extends Map {
  toJS () {
    return this.size ? super.toJS() : null
  }
}
