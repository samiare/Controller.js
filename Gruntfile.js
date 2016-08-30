module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            options: {
                footer: '\n',
            },
            build_min: {
                files: {
                    'dist/Controller.min.js': [ 'source/*.js', 'source/lib/**/*.js' ],
                },
                options: {
                    banner: '/*! Controller.min.js - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                }
            },
            build_min_layouts: {
                files: {
                    'dist/Controller.layouts.min.js': [ 'source/layouts/*.js' ]
                },
                options: {
                    banner: '/*! Controller.layouts.min.js - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                }
            },
            build_full: {
                files: {
                    'dist/unminified/Controller.js': [ 'source/*.js', 'source/lib/**/*.js' ],
                },
                options: {
                    banner: '/*! Controller.js - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    beautify: true,
                    mangle: false,
                    compress: false
                }
            },
            build_full_layouts: {
                files: {
                    'dist/unminified/Controller.layouts.js': [ 'source/layouts/*.js' ]
                },
                options: {
                    banner: '/*! Controller.layouts.js - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    beautify: true,
                    mangle: false,
                    compress: false
                }
            }
        },

        clean: {
            all: ['dist/*'],
            main: ['dist/unminified/Controller.js', 'dist/Controller.min.js'],
            layouts: ['dist/unminified/Controller.layouts.js', 'dist/Controller.layouts.min.js'],
            site: ['tester', 'index.html', 'favicon.ico', 'safari-pinned-icon.svg']
        },

        jshint: {
            src: ['gruntfile.js', 'source/**/*.js'],
            options: {
                validthis: true,
                esversion: 6
            }
        },

        compress: {
            build: {
                options: {
                    archive: 'dist/Controller.js-<%= pkg.version %>.zip',
                    mode: 'zip'
                },
                files: [{
                    cwd: 'dist/',
                    expand: true,
                    src: '**/*'
                }]
            },
            example: {
                options: {
                    archive: 'tester/ControllerTester.zip',
                    mode: 'zip'
                },
                files: [{
                    cwd: 'tester/',
                    expand: true,
                    src: '**/*'
                }]
            }
        },

        babel: {
            build_min: {
                files: {
                    'dist/Controller.min.js': 'dist/Controller.min.js'
                }
            },
            build_min_layouts: {
                files: {
                    'dist/Controller.layouts.min.js': 'dist/Controller.layouts.min.js'
                }
            },
            build_full: {
                files: {
                    'dist/unminified/Controller.js': 'dist/unminified/Controller.js'
                }
            },
            build_full_layouts: {
                files: {
                    'dist/unminified/Controller.layouts.js': 'dist/unminified/Controller.layouts.js'
                }
            },
            options: {
                presets: ['es2015']
            }
        },

        shell: {
            copylib: {
                command: [
                    'unzip "dist/Controller.js-*.zip" -d tester/js',
                    'rm -rf tester/js/Controller.min.js',
                    'rm -rf tester/js/Controller.layouts.min.js',
                    'mv tester/js/unminified/Controller.js tester/js/Controller.js',
                    'mv tester/js/unminified/Controller.layouts.js tester/js/Controller.layouts.js',
                    'rm -rf tester/js/unminified'
                ].join('&&')
            },
            copysite: {
                command: [
                    'git checkout gh-pages -- js styles images',
                    'git checkout gh-pages -- index.html favicon.ico safari-pinned-icon.svg',
                    'mkdir tester',
                    'mv js tester/js',
                    'mv styles tester/styles',
                    'mv images tester/images',
                    'mv index.html tester/index.html',
                    'mv favicon.ico tester/favicon.ico',
                    'mv safari-pinned-icon.svg tester/safari-pinned-icon.svg',
                ].join('&&')
            }
        },

        replace: {
            footer: {
                src: ['tester/index.html'],
                overwrite: true,
                replacements: [{
                    from: 'visible-footer',
                    to: 'hidden-footer'
                }]
            }
        }

    });


    // --- Library

    // JSHint
    grunt.registerTask('hint', ['jshint']);

    // Builds everything
    grunt.registerTask('build', [
        'jshint',
        'clean:all',
        'uglify:build_min',
        'uglify:build_full',
        'uglify:build_min_layouts',
        'uglify:build_full_layouts',
        'babel',
        'compress:build'
    ]);

    // Builds only Controller.js
    grunt.registerTask('only_main', ['jshint', 'clean:main', 'uglify:build_min', 'uglify:build_full', 'babel:build_min', 'babel:build_full']);

    // Builds only Controller.layouts.js
    grunt.registerTask('only_layouts', ['jshint', 'clean:layouts', 'uglify:build_min_layouts', 'uglify:build_full_layouts', 'babel:build_min_layouts', 'babel:build_full_layouts']);


    // --- Test Site

    grunt.registerTask('tester', ['clean:site', 'shell:copysite', 'shell:copylib', 'replace:footer', 'compress:example']);


};
