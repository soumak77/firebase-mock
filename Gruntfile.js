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

    watch: {
      test: {
        files: ['MockFirebase.js', 'Gruntfile.js', 'test/**'],
        tasks: ['test']
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
          "chai", "lodash"
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
    }

  });

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', ['mochaTest']);

  grunt.registerTask('default', ['test', 'watch']);
};
