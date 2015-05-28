'use strict'

import ValueMap from 'immutable-value-map'
import toJSIn from 'immutable-to-js-in'
import toFirebase from 'to-firebase'
import immutableDiff from 'immutablediff'
import {fromJS} from 'immutable'

export default class FirebaseMap extends ValueMap {
  static fromJS = fromJS
  getIn (keyPath, notSetValue = null) {
    return super.getIn(keyPath, notSetValue) // eslint-disable-line no-undef
  }
  toJSIn (keyPath) {
    return toFirebase(toJSIn(this, keyPath))
  }
  toJS () {
    return toFirebase(super.toJS())
  }
  diff (newMap) {
    return immutableDiff(this.get(), newMap.get())
  }
}
