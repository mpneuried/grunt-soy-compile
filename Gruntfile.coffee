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
		#watch:
		#	options: 
		#		spawn: false
		regarde:
			tasks:
				files: ["_src/tasks/*.coffee"]
				tasks: "coffee:tasks"

			soyComplex:
				files: ["test/tmpls/*.soy"]
				tasks: "soycompile:testLangExtLangIn"

		coffee:
			tasks:
				expand: true
				cwd: '_src',
				src: ["tasks/*.coffee"]
				dest: ""
				ext: ".js"
		
		# Before generating any new files, remove any previously-created files.
		clean:
			tests: ["tmp"]

		
		# Configuration to be run (and then tested).
		soycompile:
			test:
				expand: true
				cwd: 'test/tmpls',
				src: ["*.soy"]
				dest: "tmp/test"
				options:
					jarPath: "~/local/soy"
					ext: ".soy.js"

			testLang:
				expand: true
				cwd: 'test/tmpls',
				src: ["*.soy"]
				dest: "tmp/testLang"
				options:
					jarPath: "~/local/soy"
					msgextract: true
					sourceLang: "de_DE"
					languages: [ "de_DE", "en_GB" ]
					extractmsgpath: "tmp/lang_out"

			testLangExtLangIn:
				expand: true
				cwd: 'test/tmpls',
				src: ["*.soy"]
				dest: "tmp/testLangExtLangIn"
				options:
					isUsingIjData: true
					jarPath: "~/local/soy"
					msgextract: true
					sourceLang: "de_DE"
					languages: [ "de_DE", "en_GB" ]
					extractmsgpath: "tmp/lang_out"
					infusemsgpath: "test/lang_in"

			testLangExtLangInMissingXLIFF:
				expand: true
				cwd: 'test/tmpls',
				src: ["*.soy"]
				dest: "tmp/testLangExtLangInSingleExtract"
				options:
					jarPath: "~/local/soy"
					ext: ".soy.js"
					msgextract: true
					sourceLang: "de_DE"
					languages: [ "de_DE", "en_GB", "jp_JP", "cz_CN" ]
					extractmsgpath: "tmp/lang_out"
					infusemsgpath: "test/lang_in"

			testLangExtLangInSingleExtract:
				expand: true
				cwd: 'test/tmpls',
				src: ["*.soy"]
				dest: "tmp/testLangExtLangInSingleExtract"
				options:
					jarPath: "~/local/soy"
					msgextract: true
					sourceLang: "de_DE"
					languages: [ "de_DE", "en_GB" ]
					singleLangXLIFF: "de_DE"
					extractmsgpath: "tmp/lang_out"
					infusemsgpath: "test/lang_in"

			combineToOneFile:
				src: ['test/tmpls/test.soy', 'test/tmpls/test.nr2.soy']
				dest: 'tmp/testCombined/combined.js'
				options:
					jarPath: "~/local/soy"

			combineToOneFileComplexSingleExtract:
				src: ['test/tmpls/test.soy', 'test/tmpls/test.nr2.soy']
				dest: 'tmp/testCombined/combinedComplex.js'
				options:
					jarPath: "~/local/soy"
					msgextract: true
					sourceLang: "de_DE"
					languages: [ "de_DE", "en_GB" ]
					singleLangXLIFF: "de_DE"
					extractmsgpath: "tmp/lang_out"
					infusemsgpath: "test/lang_in"

			combineToOneFileComplex:
				src: ['test/tmpls/test.soy', 'test/tmpls/test.nr2.soy']
				dest: 'tmp/testCombined/combinedComplex.js'
				options:
					jarPath: "~/local/soy"
					msgextract: true
					sourceLang: "de_DE"
					languages: [ "de_DE", "en_GB", "jp_JP", "cz_CN" ]
					extractmsgpath: "tmp/lang_out"
					infusemsgpath: "test/lang_in"

			combineToOneFileComplexWildcard:
				src: ['test/tmpls/**/*.soy']
				dest: 'tmp/testCombinedWildcard/combinedComplex.js'
				options:
					jarPath: "~/local/soy"
					msgextract: true
					sourceLang: "de_DE"
					languages: [ "de_DE", "en_GB", "jp_JP", "cz_CN" ]
					extractmsgpath: "tmp/lang_out"
					infusemsgpath: "test/lang_in"

			usingCompileFlags:
				src: ['test/tmpls/test.soy', 'test/tmpls/test.nr2.soy']
				dest: 'tmp/testCombined/flags.js'
				options:
					jarPath: "~/local/soy"
					compileflags:
						shouldGenerateJsdoc: true
						shouldProvideRequireSoyNamespaces: true
						shouldDeclareTopLevelNamespaces: true
						codeStyle: "concat"


		# Unit tests.
		nodeunit:
			tests: ["test/*_test.js"]

	
	# Actually load this plugin's task(s).
	grunt.loadTasks "tasks"
	
	# These plugins provide necessary tasks.
	grunt.loadNpmTasks "grunt-contrib-clean"
	grunt.loadNpmTasks "grunt-contrib-nodeunit"
	# just for developing this plugin
	grunt.loadNpmTasks "grunt-regarde"
	#grunt.loadNpmTasks "grunt-contrib-watch"
	grunt.loadNpmTasks "grunt-contrib-coffee"
	
	grunt.registerTask "watch", "regarde"

	# Whenever the "test" task is run, first clean the "tmp" dir, then run this
	# plugin's task(s), then test the result.
	grunt.registerTask "test", ["clean", "soycompile"]
	
	# By default, lint and run all tests.
	grunt.registerTask "default", ["coffee", "test"]