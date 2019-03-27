'use strict';

function MockFirestoreFieldPath(...segments) {
  this.segments = segments;
}

module.exports = MockFirestoreFieldPath;
