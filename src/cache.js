'use strict'

module.exports = RefCache

function RefCache () {
  this.store = new Map()
  this.disable()
}

RefCache.prototype.enable = function () {
  this.enabled = true
}

RefCache.prototype.disable = function () {
  this.enabled = false
}

RefCache.prototype.clear = function () {
  this.store.forEach(function (value, key) {
    this.store.delete(key)
  }, this)
}

RefCache.prototype.get = function () {
  if (!this.enabled) return
  return this.store.get.apply(this.store, arguments)
}

RefCache.prototype.set = function () {
  if (!this.enabled) return this
  return this.store.set.apply(this.store, arguments)
}

Object.defineProperty(RefCache.prototype, 'size', {
  get: function () {
    return this.store.size
  }
})
