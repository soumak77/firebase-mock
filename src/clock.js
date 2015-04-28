'use strict'

export default class Clock {
  time = getTime
  set (time) {
    Object.assign(this, {time})
  }
  restore () {
    this.time = getTime
  }
}

function getTime () {
  return new Date().getTime()
}
