'use strict';

var _ = require('lodash');

exports.makeSnap = function makeSnap (ref, data, pri) {
  data = _.cloneDeep(data);
  if (_.isObject(data) && _.isEmpty(data)) { data = null; }
  return {
    val: function () { return data; },
    ref: function () { return ref; },
    name: function () { return ref.name(); },
    getPriority: function () { return pri; },
    forEach: function(cb, scope) {
      var self = this;
      _.each(data, function (v, k) {
        var res = cb.call(scope, self.child(k));
        return res !== true;
      });
    },
    child: function (key) {
      return makeSnap(ref.child(key), _.isObject(data) && _.has(data, key)? data[key] : null, ref.child(key).priority);
    }
  };
};

exports.makeRefSnap = function makeRefSnap(ref) {
  return exports.makeSnap(ref, ref.getData(), ref.priority);
};

exports.mergePaths = function mergePaths (base, add) {
  return base.replace(/\/$/, '')+'/'+add.replace(/^\//, '');
};

exports.cleanData = function cleanData(data) {
  var newData = _.clone(data);
  if(_.isObject(newData)) {
    if(_.has(newData, '.value')) {
      newData = _.clone(newData['.value']);
    }
    if(_.has(newData, '.priority')) {
      delete newData['.priority'];
    }
//      _.each(newData, function(v,k) {
//        newData[k] = cleanData(v);
//      });
    if(_.isEmpty(newData)) { newData = null; }
  }
  return newData;
};

exports.getMeta = function getMeta (data, key, defaultVal) {
  var val = defaultVal;
  var metaKey = '.' + key;
  if (_.isObject(data) && _.has(data, metaKey)) {
    val = data[metaKey];
    delete data[metaKey];
  }
  return val;
};

exports.assertKey = function assertKey (method, key, argNum) {
  if (!argNum) argNum = 'first';
  if (typeof(key) !== 'string' || key.match(/[.#$\/\[\]]/)) {
    throw new Error(method + ' failed: '+ argNum+' was an invalid key "'+(key+'')+'. Firebase keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');
  }
};

exports.priAndKeyComparator = function priAndKeyComparator (testPri, testKey, valPri, valKey) {
  var x = 0;
  if (!_.isUndefined(testPri)) {
    x = exports.priorityComparator(testPri, valPri);
  }
  if (x === 0 && !_.isUndefined(testKey) && testKey !== valKey) {
    x = testKey < valKey? -1 : 1;
  }
  return x;
};

exports.priorityComparator = function priorityComparator (a, b) {
  if (a !== b) {
    if (a === null || b === null) {
      return a === null? -1 : 1;
    }
    if (typeof a !== typeof b) {
      return typeof a === 'number' ? -1 : 1;
    } else {
      return a > b ? 1 : -1;
    }
  }
  return 0;
};
