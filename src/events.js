'use strict'

import isParent from 'subdir'

export function dispatch (listeners, diff) {
  diff.forEach((change) => {
    listeners.forEach(listener => trigger(listener, change))
  })
}

function trigger (listener, change) {
  if (below(listener.path, change.get('path'))) {
    if ((listener.event) === 'value') {
      listener.callback.call(listener.context)
    }
  }
}

function below (parent, path) {
  return parent === path || isParent(parent, path)
}
