'use strict';

var gulp            = require('gulp');
var plugins         = require('gulp-load-plugins')();
var _               = require('lodash');
var browserify      = require('browserify');
var source          = require('vinyl-source-stream');
var buffer          = require('vinyl-buffer');
var fs              = require('fs');
var argv            = require('yargs').argv;
var streamToPromise = require('stream-to-promise');
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
      standalone: 'mockfirebase'
    })
    .add(pkg.main)
    .bundle()
    .pipe(source('mockfirebase.js'))
    .pipe(buffer())
    .pipe(plugins.header(fs.readFileSync('./helpers/header.txt'), {
      pkg: _.extend(require('./package.json'), {
        version: version()
      })
    }))
    .pipe(plugins.footer(fs.readFileSync('./helpers/globals.js')));
}

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

gulp.task('smoke', function () {
  var name = Date.now() + '-mockfirebase.js';
  var dir = os.tmpdir();
  var bundlePath = path.join(dir, name);
  return streamToPromise(bundle()
    .pipe(plugins.rename(name))
    .pipe(gulp.dest(dir)))
    .then(function () {
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
        autoWatch: false,
        singleRun: true
      });
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
      version: version()
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('release', ['bundle', 'bump'], function () {
  var versionString = 'v' + version();
  var message = 'Release ' + versionString;
  return plugins.shell.task([
    'git add -f ./browser/mockfirebase.js',
    'git add ' + pkgs.join(' '),
    'git commit -m "' + message + '"',
    'git tag ' + versionString
  ])();
});
