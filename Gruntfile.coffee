#
# * grunt-contrib-concat
# * http://gruntjs.com/
# *
# * Copyright (c) 2012 "Cowboy" Ben Alman, contributors
# * Licensed under the MIT license.
# 
"use strict"
module.exports = (grunt) ->
	
	# Project configuration.
	grunt.initConfig
		watch:
			tasks:
				files: ["_src/tasks/*.coffee"]
				tasks: "coffee:tasks"

			soy:
				files: ["test/tmpls/*.soy"]
				tasks: "soycompile:test"

		coffee:
			tasks:
				expand: true
				cwd: '_src',
				src: ["tasks/*.coffee"]
				dest: ""
				ext: ".js"

		jshint:
			all: ["Gruntfile.js", "tasks/*.js", "<%= nodeunit.tests %>"]
			options:
				jshintrc: ".jshintrc"

		
		# Before generating any new files, remove any previously-created files.
		clean:
			tests: ["tmp"]

		
		# Configuration to be run (and then tested).
		soycompile:
			test:
				expand: true
				cwd: 'test/tmpls',
				src: ["*.soy"]
				dest: "tmp"
				ext: ".js"
				options:
					languages: [ "de_DE" ]


		
		# Unit tests.
		nodeunit:
			tests: ["test/*_test.js"]

	
	# Actually load this plugin's task(s).
	grunt.loadTasks "tasks"
	
	# These plugins provide necessary tasks.
	grunt.loadNpmTasks "grunt-contrib-jshint"
	grunt.loadNpmTasks "grunt-contrib-clean"
	grunt.loadNpmTasks "grunt-contrib-nodeunit"
	# just for developing this plugin
	grunt.loadNpmTasks "grunt-contrib-watch"
	grunt.loadNpmTasks "grunt-contrib-coffee"
	
	# Whenever the "test" task is run, first clean the "tmp" dir, then run this
	# plugin's task(s), then test the result.
	grunt.registerTask "test", ["clean", "soycompile", "nodeunit"]
	
	# By default, lint and run all tests.
	grunt.registerTask "default", ["test"]