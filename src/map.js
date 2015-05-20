'use strict'

import {Map, fromJS} from 'immutable'
const {isMap} = Map
import immutablediff from 'immutablediff'

export {Map, fromJS}

export function toJS (map) {
  return map.size ? map.toJS() : null
}

export function getIn (map, keyPath) {
  if (!Map.isMap(map)) {
    if (!keyPath.length) return map
    return null
  }
  return map.getIn(keyPath, null)
}

export function toJSIn (map, keyPath) {
  const data = getIn(map, keyPath)
  return isMap(data) ? toJS(data) : data
}

export function diff (map1, map2) {
  return immutablediff(map1, map2)
}
