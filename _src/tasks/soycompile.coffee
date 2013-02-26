exec = require('child_process').exec
path = require( "path" )


simpleCompile = ( aFns, file, options, grunt )->
	for f in file.src
		aFns.push ( cba )->
		
			_target = path.resolve( file.dest ) 
			grunt.log.writeln('Compile ' + f + ' to ' + file.dest + ".")
			fName = path.basename(f, '.soy')

			_targetLangs = path.resolve( options.extractmsgpath ) 
			grunt.file.mkdir( "tmp/lang" )

			_command = "java -jar #{ options.soycompilerPath } --outputPathFormat #{ _target[..-4] }.js #{ path.resolve( f ) }"

			grunt.verbose.writeln( _command )
			exec _command, ( err, stdout, stderr )=>
				if errgrunt
					cba( err )
					return

				cba( null, stdout )
				return
			return

	aFns

extractAndCompile = ( aFns, file, options, grunt )->
	for f in file.src
		aFns.push ( cba )->
			_target = path.resolve( file.dest ) 
			grunt.log.writeln('Compile ' + f + ' to ' + file.dest + ".")
			fName = path.basename(f, '.soy')

			_command = "java -jar #{ options.msgExtPath } --outputFile #{ _target[..-4] }.js #{ path.resolve( f ) }"

			grunt.verbose.writeln( _command )
			exec _command, ( err, stdout, stderr )=>
				if errgrunt
					cba( err )
					return

				cba( null, stdout )
				return
			return

	aFns

module.exports = ( grunt )->
	grunt.registerMultiTask "soycompile", "Compile soy files", ->

		done = this.async()

		options = this.options
			extract: false
			extractmsgpath: null
			infusemsgpath: null
			languages: []
			outputPathFormat: ""

		grunt.verbose.writeflags(options, 'Options')

		options.msgExtPath =  path.resolve( __dirname + "/../_java/SoyMsgExtractor.jar" )
		options.soycompilerPath =  path.resolve( __dirname + "/../_java/SoyToJsSrcCompiler.jar" )

		grunt.verbose.writeflags( { compiler: options.soycompilerPath, msgext: options.msgExtPath }, 'Jar Paths')

		aFns = []

		grunt.file.mkdir( "tmp" )

		this.files.forEach ( file )->

			if not options.extract
				simpleCompile( aFns, file, options, grunt )
			else if options.extract and options.extractmsgpath
				extractAndCompile( aFns, file, options, grunt )
			return		

		grunt.util.async.parallel aFns, ( err, result )=>
			if err
				grunt.fail.warn( err )
			else
				grunt.log.debug( result )
			done()
			return


		return

	return