'use strict'

import isParent from 'subdir'
import Snapshot from './snapshot'

export function dispatch (reference, listeners, diff) {
  diff.forEach((change) => {
    listeners.forEach(listener => trigger(reference, listener, change))
  })
}

function trigger (reference, listener, change) {
  if (below(listener.path, change.get('path'))) {
    if ((listener.event) === 'value') {
      listener.callback.call(listener.context, Snapshot.create(reference))
    }
  }
}

function below (parent, path) {
  return parent === path || isParent(parent, path)
}
