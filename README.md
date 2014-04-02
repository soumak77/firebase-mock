MockFirebase
============

**This is an experimental library currently under development. Use with caution and submit PRs for fixes and enhancements.**

A Firebase stub useful for unit testing.

## Installation

### Node.js

    git clone git@github.com:katowulf/mockfirebase.git
    cd mockfirebase
    npm install

### Web

   <script src="lodash.js"></script>
   <script src="sinon.js"></script>
   <script src="MockFirebase.js"></script>

## Usage

MockFirebase is designed to be used synchronously or asynchronously for unit testing by allowing you complete
control over when each event is triggered, via the `flush()` command.

    var fb = new MockFirebase(ANY_URLISH_STRING); // loads the default data
    var spy = sinon.spy();
    fb.on('value', spy);
    fb.set({ foo: 'bar' });
    expect(spy.called).to.be(false); // it is!
    fb.flush();
    expect(spy.called).to.be(true); // it is!

See [angularFire's unit tests](https://github.com/firebase/angularFire/blob/master/tests/unit/AngularFire.spec.js) for examples of the MockFirebase in action.

## Specifying data

You can specify the default data to be used by setting `MockFirebase.DEFAULT_DATA` to an object. You can also
specify data per-instance by adding a second arg to the constructor:  `new MockFirebase(ANY_URLISH_STRING, dataToUse);`

## API

All the regular Firebase methods are(?) supported. In addition, the following test-related methods exist:

### flush

    @param {boolean|int} [delay] in milliseconds
    @returns {MockFirebase}

Invoke all the operations that have been queued thus far. If a numeric delay is specified, this
occurs asynchronously. Otherwise, it is a synchronous event (at the time flush is called).

This allows Firebase to be used in synchronous tests without waiting for async callbacks. It also
provides a rudimentary mechanism for simulating locally cached data (events are triggered
synchronously when you do on('value') or on('child_added'))

If you call this multiple times with different delay values, you can invoke the events out
of order, as might happen on a network with some latency, or if multiple users update values "simultaneously".

### autoFlush

    @param {int|boolean} [delay] in milliseconds

Automatically trigger a flush event after each operation. If a numeric delay is specified, this is an
asynchronous event. If value is set to true, it is synchronous (flush is triggered immediately). Setting
this to false disabled autoFlush

### failNext

    @param {String} methodName currently only supports `set` and `transaction`
    @param {String|Error} error

Simulate a failure by specifying that the next invocation of methodName should fail with the provided error.

## getData

@returns {*}

Returns a copy of the current data

# Contributing

 - Fork the repo
 - make your additions
 - update the version number in package.json and at the top of MockFirebase.js
 - submit a pull request.

# Support

Use the [issues list](https://github.com/katowulf/mockfirebase/issues) for questions and troubleshooting help.