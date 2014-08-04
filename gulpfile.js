'use strict';

var gulp       = require('gulp');
var plugins    = require('gulp-load-plugins')();
var _          = require('lodash');
var browserify = require('browserify');
var source     = require('vinyl-source-stream');
var buffer     = require('vinyl-buffer');
var fs         = require('fs');
var argv       = require('yargs').argv;
var internals  = {};

var version;
internals.version = function () {
  var previous = require('./package.json').version;
  if (!version) version = require('semver').inc(previous, argv.type || 'patch');
  return version;
};

gulp.task('bundle', function () {
  return browserify({
    standalone: 'mockfirebase'
  })
  .add('./src/MockFirebase.js')
  .transform('browserify-shim')
  .bundle()
  .pipe(source('mockfirebase.js'))
  .pipe(buffer())
  .pipe(plugins.header(fs.readFileSync('./helpers/header.txt'), {
    pkg: _.extend(require('./package.json'), {
      version: internals.version()
    })
  }))
  .pipe(plugins.footer(fs.readFileSync('./helpers/globals.js')))
  .pipe(gulp.dest('./dist'));
});

gulp.task('cover', function () {
  return gulp.src('./src/**/*.js')
    .pipe(plugins.istanbul());
});

gulp.task('test', ['cover'], function () {
  return gulp.src('test/**/*.js')
    .pipe(plugins.mocha())
    .pipe(plugins.istanbul.writeReports());
});

gulp.task('karma', function () {
  return require('karma-as-promised').server.start({
    frameworks: ['browserify', 'mocha', 'sinon'],
    browsers: ['PhantomJS'],
    files: [
      'node_modules/es5-shim/es5-shim.js',
      'test/**/*.spec.js'
    ],
    preprocessors: {
      'test/**/*.spec.js': ['browserify']
    },
    browserify: {
      debug: true,
      transform: ['browserify-shim']
    },
    autoWatch: false,
    singleRun: true
  });
});

gulp.task('lint', function () {
  return gulp.src(['./gulpfile.js', './src/**/*.js', './test/**/*.js'])
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(plugins.jshint.reporter('fail'));
});

gulp.task('release', ['bundle'], function (done) {
  gulp.src('./dist/mockfirebase.js')
    .pipe(plugins.git.add({args: '-f'}))
    .on('finish', function () {
      gulp.src(['./package.json', './bower.json'])
        .pipe(plugins.bump({version: internals.version()}))
        .pipe(gulp.dest('./'))
        .pipe(plugins.git.add())
        .on('finish', function () {
          var version = 'v' + internals.version();
          var message = 'Release ' + version;
          gulp.src(['./package.json', './bower.json', './dist/mockfirebase.js'])
            .pipe(plugins.git.commit(message))
            .on('finish', function () {
              plugins.git.tag(version, message, function () {
                done();
              });
            });
        });
    });
});
