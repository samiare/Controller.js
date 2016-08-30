var projectVars = {};

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        clean: {
            dist: ['index.html', 'favicon.ico', 'safari-pinned-icon.svg', 'js/', 'images/', 'styles/']
        },

        compass: {
            build: {
                options: {
                    sassDir: '_source/scss',
                    cssDir: 'styles'
                }
            }
        },

        shell: {
            checkoutlib: {
                command: [
                    'git checkout master -- "dist/Controller.js-*.zip"',
                    'unzip "dist/Controller.js-*.zip" -d tempjs',
                    'mv tempjs/unminified/Controller.js js/Controller.js',
                    'mv tempjs/unminified/Controller.layouts.js js/Controller.layouts.js',
                    'rm -rf tempjs',
                    'rm -rf dist'
                ].join('&&')
            },
            getvars: {
                command: 'git show master:package.json',
                options: {
                    stdout: false,
                    callback: function(err, stdout, stderr, cb) {
                        if (err) {
                            cb(err);
                            return;
                        }

                        projectVars = JSON.parse(stdout);

                        cb();
                    }
                }
            }
        },

        copy: {
            build: {
                files: [
                    {expand: true, flatten: true, src: ['_source/*', '!_source/index.html'], dest: '', filter: 'isFile'},
                    {expand: true, flatten: true, src: ['_source/js/*'], dest: 'js/', filter: 'isFile'},
                    {expand: true, flatten: true, src: ['_source/images/*'], dest: 'images/', filter: 'isFile'}
                ]
            }
        },

        replace: {
            build: {
                src: ['_source/index.html'],
                dest: 'index.html',
                replacements: [
                    {
                        from: '{{version}}',
                        to: function() {
                            return projectVars.version;
                        }
                    },
                    {
                        from: '{{description}}',
                        to: function() {
                            return projectVars.description;
                        }
                    },
                    {
                        from: '{{name}}',
                        to: function() {
                            return projectVars.name
                        }
                    }
                ]
            }
        }
    });

    grunt.registerTask('build', ['clean:dist', 'copy:build', 'shell:checkoutlib', 'compass:build', 'shell:getvars', 'replace:build']);

};
