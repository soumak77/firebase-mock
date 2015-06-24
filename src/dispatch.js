'use strict'

var isParent = require('subdir')
var Snapshot = require('./snapshot')

module.exports = function dispatch (root, listeners, diff) {
  diff.forEach(function (change) {
    listeners.forEach(function (listener) {
      trigger(root, listener, change)
    })
  })
}

function trigger (root, listener, change) {
  if (below(listener.path, change.get('path'))) {
    if ((listener.event) === 'value') {
      listener.call(new Snapshot(root.child(listener.path)))
    }
  }
}

function below (parent, path) {
  return parent === path || isParent(parent, path)
}
