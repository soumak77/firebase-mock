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
  return browserify()
    .add('./src/MockFirebase.js')
    .transform('browserify-shim')
    .bundle({
      standalone: 'mockfirebase'
    })
    .pipe(source('mockfirebase.js'))
    .pipe(buffer())
    .pipe(plugins.header(fs.readFileSync('./helpers/header.txt'), {
      pkg: _.extend(require('./package.json'), {
        version: internals.version()
      })
    }))
    .pipe(plugins.footer(fs.readFileSync('./helpers/globals.js')))
    .pipe(gulp.dest('./browser'));
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

var pkgs = ['./package.json', './bower.json'];
gulp.task('bump', function () {
  return gulp.src(pkgs)
    .pipe(plugins.bump({
      version: internals.version()
    }));
});

gulp.task('release', ['bundle', 'bump'], function () {
  var version = 'v' + internals.version();
  var message = 'Release ' + version;
  return plugins.shell.task([
    'git add -f ./browser/mockfirebase.js',
    'git add ' + pkgs.join(' '),
    'git commit -m ' + message
    'git tag ' + version + ' -m ' + message
  ])();
});
