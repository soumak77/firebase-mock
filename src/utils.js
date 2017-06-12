'use strict';

var Snapshot = require('./snapshot');
var _ = require('lodash');

exports.makeRefSnap = function makeRefSnap(ref) {
  return new Snapshot(ref, ref.getData(), ref.priority);
};

exports.mergePaths = function mergePaths(base, add) {
  return base.replace(/\/$/, '') + '/' + add.replace(/^\//, '');
};

exports.cleanData = function cleanData(data) {
  var newData = _.clone(data);
  if (_.isObject(newData)) {
    if (_.has(newData, '.value')) {
      newData = _.clone(newData['.value']);
    }
    if (_.has(newData, '.priority')) {
      delete newData['.priority'];
    }
//      _.each(newData, function(v,k) {
//        newData[k] = cleanData(v);
//      });
    if (_.isEmpty(newData)) {
      newData = null;
    }
  }
  return newData;
};

exports.getMeta = function getMeta(data, key, defaultVal) {
  var val = defaultVal;
  var metaKey = '.' + key;
  if (_.isObject(data) && _.has(data, metaKey)) {
    val = data[metaKey];
    delete data[metaKey];
  }
  return val;
};

exports.assertKey = function assertKey(method, key, argNum) {
  if (!argNum) argNum = 'first';
  if (typeof(key) !== 'string' || key.match(/[.#$\/\[\]]/)) {
    throw new Error(method + ' failed: ' + argNum + ' was an invalid key "' + (key + '') + '. Firebase keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');
  }
};

exports.priAndKeyComparator = function priAndKeyComparator(testPri, testKey, valPri, valKey) {
  var x = 0;
  if (!_.isUndefined(testPri)) {
    x = exports.priorityComparator(testPri, valPri);
  }
  if (x === 0 && !_.isUndefined(testKey) && testKey !== valKey) {
    x = testKey < valKey ? -1 : 1;
  }
  return x;
};

exports.priorityComparator = function priorityComparator(a, b) {
  if (a !== b) {
    if (a === null || b === null) {
      return a === null ? -1 : 1;
    }
    if (typeof a !== typeof b) {
      return typeof a === 'number' ? -1 : 1;
    } else {
      return a > b ? 1 : -1;
    }
  }
  return 0;
};

exports.isServerTimestamp = function isServerTimestamp(data) {
  return _.isObject(data) && data['.sv'] === 'timestamp';
};

exports.removeEmptyProperties = function removeEmptyProperties(obj) {
  var t = typeof obj;
  if (t === 'boolean' || t === 'string' || t === 'number' || t === 'undefined') {
    return obj;
  }

  var keys = getKeys(obj);
  if (keys.length === 0) {
    return null;
  } else {
    for (var s in obj) {
      var value = removeEmptyProperties(obj[s]);
      if (value === null) {
        delete obj[s];
      }
    }
    if (getKeys(obj).length === 0) {
      return null;
    }
  }
  return obj;

  function getKeys(o) {
    var result = [];
    for (var s in o) result.push(s);
    return result;
  }
};

exports.updateToObject = function updateToObject(update) {
  var result = {};
  for (var s in update) {
    var parts = s.split('/');
    var value = update[s];
    var o = result;
    do {
      var newObject = {};
      var key = parts.shift();
      o[key] = parts.length > 0 ? newObject : value;
      o = newObject;
    } while (parts.length);
  }
  return result;
};