'use strict';

var gulp       = require('gulp');
var plugins    = require('gulp-load-plugins')();
var browserify = require('browserify');
var source     = require('vinyl-source-stream');
var buffer     = require('vinyl-buffer');
var fs         = require('fs');

gulp.task('bundle', function () {
  return browserify({
    standalone: 'mockfirebase'
  })
  .add('./src/MockFirebase.js')
  .transform('browserify-shim')
  .bundle()
  .pipe(source('MockFirebase.js'))
  .pipe(buffer())
  .pipe(plugins.header(fs.readFileSync('./helpers/header.txt'), {
    pkg: require('./package.json')
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
