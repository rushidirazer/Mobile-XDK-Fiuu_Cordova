'use strict';

module.exports = function(grunt) {
    // Automatically load required Grunt tasks
    require('jit-grunt')(grunt, {
        removelogging: 'grunt-remove-logging'
    });

    grunt.initConfig({

        obfuscator: {
            options: {
                // global options for the obfuscator
            },
            task1: {
                options: {
                    // options for each sub task
                },
                files: {
                    'molpay-mobile-xdk-cordova/molpay.js': [
                        '.tmp/molpay-original.js'
                    ]
                }
            }
        },

        removelogging: {
            dist: {
                files: [{
                    expand: true,
                    src: ['molpay-original.js'],
                    cwd: '',
                    dest: '.tmp/'
                }]
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '',
                    dest: '.tmp',
                    src: ['molpay-original.js']
                }]
            }
        },

        uglify: {
            options: {
                mangleProperties: false,
                reserveDOMCache: false
            },
            my_target: {
                files: {
                    '.tmp/molpay-original.js': ['.tmp/molpay-original.js'] //'molpay-mobile-xdk-cordova/molpay.js': ['molpay-original.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify'); // load the given tasks
    grunt.registerTask('build', ['clean:dist', 'uglify', 'obfuscator']); // Default grunt tasks maps to grunt//
    grunt.registerTask('dist', ['clean:dist', 'removelogging', 'uglify', 'obfuscator']);
};