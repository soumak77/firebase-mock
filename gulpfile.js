'use strict';

var gulp            = require('gulp');
var plugins         = require('gulp-load-plugins')();
var _               = require('lodash');
var browserify      = require('browserify');
var source          = require('vinyl-source-stream');
var buffer          = require('vinyl-buffer');
var fs              = require('fs');
var argv            = require('yargs').argv;
var path            = require('path');
var os              = require('os');

var v;
function version () {
  var previous = require('./package.json').version;
  if (!v) v = require('semver').inc(previous, argv.type || 'patch');
  return v;
}

function bundle () {
  var pkg = require('./package.json');
  return browserify({
      standalone: 'firebasemock'
    })
    .add(pkg.main)
    .bundle()
    .pipe(source('firebasemock.js'))
    .pipe(buffer())
    .pipe(plugins.header(fs.readFileSync('./helpers/header.txt'), {
      pkg: _.extend(require('./package.json'), {
        version: version()
      })
    }))
    .pipe(plugins.footer(fs.readFileSync('./helpers/globals.js')));
}

var bundlePath;
gulp.task('bundle-smoke', function () {
  var name = Date.now() + '-firebasemock.js';
  var dir = os.tmpdir();
  bundlePath = path.join(dir, name);
  return bundle()
    .pipe(plugins.rename(name))
    .pipe(gulp.dest(dir));
});

gulp.task('bundle', function () {
  return bundle().pipe(gulp.dest('./browser'));
});

gulp.task('cover', function () {
  return gulp.src(['./src/**/*.js', '!./src/login.js'])
    .pipe(plugins.istanbul())
    .pipe(plugins.istanbul.hookRequire());
});

gulp.task('test', ['cover'], function () {
  return gulp.src('test/unit/*.js')
    .pipe(plugins.mocha({
      grep: argv.grep
    }))
    .pipe(plugins.istanbul.writeReports());
});

gulp.task('karma', function () {
  return require('karma-as-promised').server.start({
    frameworks: ['browserify', 'mocha', 'sinon'],
    browsers: ['PhantomJS'],
    client: {
      args: ['--grep', argv.grep]
    },
    files: [
      'node_modules/es5-shim/es5-shim.js',
      'test/unit/*.js'
    ],
    plugins: [
      'karma-phantomjs-launcher',
      'karma-mocha',
      'karma-sinon',
      'karma-browserify'
    ],
    preprocessors: {
      'test/unit/*.js': ['browserify']
    },
    browserify: {
      debug: true
    },
    autoWatch: false,
    singleRun: true
  });
});

gulp.task('smoke', ['bundle-smoke'], function () {
  return require('karma-as-promised').server.start({
    frameworks: ['mocha', 'chai'],
    browsers: ['PhantomJS'],
    client: {
      args: ['--grep', argv.grep]
    },
    files: [
      bundlePath,
      'test/smoke/globals.js'
    ],
    plugins: [
      'karma-phantomjs-launcher',
      'karma-mocha',
      'karma-chai'
    ],
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

var pkgs = ['./package-lock.json', './package.json', './bower.json'];
gulp.task('bump', function () {
  return gulp.src(pkgs)
    .pipe(plugins.bump({
      version: version()
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('release', ['bundle', 'bump'], function () {
  var versionString = 'v' + version();
  var message = 'Release ' + versionString;
  return plugins.shell.task([
    'git add -f ./browser/firebasemock.js',
    'git add ' + pkgs.join(' '),
    'git commit -m "' + message + '"',
    'git tag ' + versionString,
    'git push',
    'git push --tags'
  ])();
});
