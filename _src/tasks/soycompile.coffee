exec = require('child_process').exec
path = require( "path" )



soyC = null

class Compiler
	constructor: ( @grunt )->

		return

	setJarPath: ( path )=>
		if path?.length
			@soyCom =  path + "/SoyToJsSrcCompiler.jar"
			@msgExt =  path + "/SoyMsgExtractor.jar"

			@grunt.verbose.writeflags( { compiler: @soyCom, msgext: @msgExt }, 'Jar Paths')
		else
			@_jarPathError()
		return

	soy2js: ( file, output, cb )=>
		if not @soyCom
			@_jarPathError()
			return
		args = 
			outputPathFormat: output
		@grunt.verbose.writeflags( args, "Args" )
		@_compile( @soyCom, file, args, cb )

		return

	soy2msg: ( file, output, lang, sourcelang, cb )=>
		if not @msgExt
			@_jarPathError()
			return
		args = 
			outputFile: output
			targetLocaleString: lang
			sourceLocaleString: sourcelang

		@grunt.verbose.writeflags( args, "Args" )
		@_compile( @msgExt, file, args, cb )
		return

	msg2js: ( file, fileFormat, output, langs, cb )=>
		if not @soyCom
			@_jarPathError()
			return
		args = 
			messageFilePathFormat: fileFormat
			outputPathFormat: output
			locales: langs

		@grunt.verbose.writeflags( args, "Args" )
		@_compile( @soyCom, file, args, cb )
		return

	_compile: ( path, file, args, cb )=>

		_command = "java -jar #{ path } "
		for key, val of args
			_command += "--#{ key } #{ val } "

		_command += file

		@grunt.verbose.writeln( _command )

		exec _command, ( err, stdout, stderr )=>
			if err
				cb( err )
				return

			cb( null, stdout )
			return
		return

	_jarPathError: =>
		_err = new Error()
		_err.name = "missing-jar-path"
		_err.message = "Before using grunt-soy-compile you have to define the jar paths by settng the option `jarPath`"
		@grunt.fail.fatal( _err )
		return

simpleCompile = ( aFns, file, options, grunt, fileFilter )->
	for f in file.src
		if not fileFilter?.length or f in fileFilter
			do( f )=>
				aFns.push ( cba )->
					_targetPath = path.resolve( file.dest ).split(path.sep)
					_targetPath.pop()
					_targetPath = _targetPath.join( path.sep )
					fname = path.basename( f, ".soy" )
					_target = _targetPath + "/" + fname + ".js"

					grunt.log.writeln('Compile ' + f + ' to ' + _target[process.cwd().length+1..] + ".")

					soyC.soy2js( path.resolve( f ), _target, cba )
					return

	aFns

extractAndCompile = ( aFns, file, options, grunt, fileFilter )->
	for f in file.src
		if not fileFilter?.length or f in fileFilter
			do( f )->
				_targetLangs = path.resolve( options.extractmsgpath ) 
				grunt.file.mkdir( options.extractmsgpath )
				
				for lang in options.languages
					do( f, lang )=>
						aFns.push ( cba )->
							msgFile = path.basename(f, '.soy') + "_" + lang + ".xlf"

							grunt.log.writeln('Extract messages from ' + f + ' to ' + msgFile + ".")
							
							soyC.soy2msg( path.resolve( f ), _targetLangs + "/" + msgFile, lang, options.sourceLang, cba )
							return

				if options.infusemsgpath?
					_sourceLangs = path.resolve( options.infusemsgpath )
				else
					_sourceLangs = _targetLangs

				aFns.push ( cba )->

					_targetPath = path.resolve( file.dest ).split(path.sep)
					_targetPath.pop()
					_targetPath = _targetPath.join( path.sep )
					fname = path.basename( f, ".soy" )
					outputPathFormat = _targetPath + "/" + fname + "_{LOCALE}.js"

					msgFileFormat = path.basename(f, '.soy') + "_{LOCALE}.xlf"
					grunt.log.writeln('Compile ' + f + ' to ' + outputPathFormat[process.cwd().length+1..] + ' using languages ' + options.languages.join( ", " ) + ".")

					soyC.msg2js( path.resolve( f ), _sourceLangs + "/" + msgFileFormat, outputPathFormat, options.languages.join( "," ), cba )
					return
	
	aFns

module.exports = ( grunt )->

	soyC = new Compiler( grunt, path.resolve( __dirname + "/../_java/" ) )

	grunt.registerMultiTask "soycompile", "Compile soy files", ->

		changed = grunt.regarde?.changed or []

		done = this.async()

		options = this.options
			msgextract: false
			extractmsgpath: null
			infusemsgpath: null
			sourceLang: "en_GB"
			languages: []
			jarPath: null

		soyC.setJarPath( options.jarPath )

		grunt.verbose.writeflags(options, 'Options')

		aFns = []

		grunt.file.mkdir( "tmp" )


		this.files.forEach ( file )->
			if not options.msgextract
				simpleCompile( aFns, file, options, grunt, changed )
			else if options.msgextract and options.extractmsgpath?
				extractAndCompile( aFns, file, options, grunt, changed )
			else
				simpleCompile( aFns, file, options, grunt, changed )
			return		

		grunt.util.async.series aFns, ( err, result )=>
			if err
				grunt.fail.warn( err )
			else
				grunt.log.debug( "RESULTS", result )
			done()
			return


		return

	return