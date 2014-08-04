/* global module */

module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> Kato\n' +
      '* MIT LICENSE */\n\n',

    browserify: {
      MockFirebase: {
        src: './src/MockFirebase.js',
        dest: './dist/MockFirebase.js',
        options: {
          bundleOptions: {
            standalone: 'MockFirebase'
          }
        }
      }
    },

    watch: {
      test: {
        files: ['src/**/*.js', 'Gruntfile.js', 'test/**'],
        tasks: ['default']
      }
    },

    // Configure a mochaTest task
    mochaTest: {
      test: {
        options: {
          growl: true,
          timeout: 5000,
          reporter: 'spec'
        },
        require: [
          "chai",
          "lodash",
          "src/**/*.js"
        ],
        log: true,
        src: ['test/*.js']
      }
    },

    notify: {
      watch: {
        options: {
          title: 'Grunt Watch',
          message: 'Build Finished'
        }
      }
    },

    concat: {
      app: {
        options: { banner: '<%= banner %>' },
        src: [
          'src/MockFirebase.js'
        ],
        dest: 'mockfirebase.js'
      }
    }

  });

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', ['mochaTest']);

  grunt.registerTask('default', ['concat', 'test']);
};
