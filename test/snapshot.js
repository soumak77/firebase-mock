'use strict'

import test from 'tape'
import {stub, spy} from 'sinon'
import {fromJS} from 'immutable'
import Snapshot from '../src/snapshot'
import Firebase from '../'

test.skip('Snapshot', (t) => {
  const ref = new Firebase('mock://')
  function withData (data) {
    ref.data = fromJS(data)
    return new Snapshot(ref)
  }
  t.test('exists', (t) => {
    t.notOk(withData({}).exists())
    t.end()
  })
  t.test('exportVal', (t) => {
    t.equal(withData().exportVal(), 1, 'value without priority')
    t.deepEqual(new Snapshot(null, 1, 2).exportVal(), {
      '.priority': 2,
      '.value': 1
    }, 'value with priority')
    let snapshot = new Snapshot(null, {
      foo: 'bar'
    }, 1)
    stub(snapshot, 'child').withArgs('foo').returns({
      val: stub().returns('bar'),
      getPriority: stub().returns(null)
    })
    t.deepEqual(snapshot.exportVal(), {
      '.priority': 1,
      foo: 'bar'
    }, 'object with priority')
    const data = {foo: {bar: 'baz'}}
    snapshot = new Snapshot(null, data, 1)
    stub(snapshot, 'child').withArgs('foo').returns({
      val: stub().returns(data.foo),
      getPriority: stub().returns(null),
      child: stub().withArgs('baz').returns({
        val: stub().returns(data.foo.bar),
        getPriority: stub().returns(null)
      })
    })
    t.deepEqual(snapshot.exportVal(), {
      '.priority': 1,
      foo: {
        bar: 'baz'
      }
    }, 'deep object')
    t.end()
  })
  t.test('forEach', (t) => {
    const [snapshot, childSnapshot] = [{foo: 'bar'}, 'bar'].map(withData)
    stub(snapshot, 'child').withArgs('foo').returns(childSnapshot)
    const callback = spy(), context = {}
    snapshot.forEach(callback, context)
    t.equal(callback.callCount, 1)
    const call = callback.firstCall
    t.deepEqual(call.args, [childSnapshot])
    t.equal(call.thisValue, context)
    t.end()
  })
  t.test('hasChild', (t) => {
    t.notOk(withData({}).hasChild('foo'))
    t.notOk(withData(null).hasChild('foo'))
    t.ok(withData({foo: 'bar'}).hasChild('foo'))
    t.end()
  })
  t.test('hasChildren', (t) => {
    t.notOk(withData({}).hasChildren())
    t.ok(withData({foo: 'bar'}).hasChildren())
    t.end()
  })
  t.test('numChildren', (t) => {
    t.equal(withData({}).numChildren(), 0)
    t.equal(withData(null).numChildren(), 0)
    t.equal(withData({foo: 'bar'}).numChildren(), 1)
    t.end()
  })
  t.end()
})
