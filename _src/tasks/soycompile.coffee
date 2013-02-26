exec = require('child_process').exec
path = require( "path" )

soyC = null

class Compiler
	constructor: ( @grunt, @classPath )->

		@soyCom =  @classPath + "/SoyToJsSrcCompiler.jar"
		@msgExt =  @classPath + "/SoyMsgExtractor.jar"

		@grunt.verbose.writeflags( { compiler: @soyCom, msgext: @msgExt }, 'Jar Paths')

		return

	soy2js: ( file, output, cb )=>
		args = 
			outputPathFormat: output
		@grunt.verbose.writeflags( args, "Args" )
		@_compile( @soyCom, file, args, cb )

		return

	soy2msg: ( file, output, lang, sourcelang, cb )=>
		args = 
			outputFile: output
			targetLocaleString: lang
			sourceLocaleString: sourcelang

		@grunt.verbose.writeflags( args, "Args" )
		@_compile( @msgExt, file, args, cb )
		return

	msg2js: ( file, fileFormat, output, langs, cb )=>
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

simpleCompile = ( aFns, file, options, grunt )->
	for f in file.src
		aFns.push ( cba )->
			_target = path.resolve( file.dest ) 
			grunt.log.writeln('Compile ' + f + ' to ' + file.dest + ".")

			soyC.soy2js( path.resolve( f ), "#{ _target[..-4] }.js", cba )
			return

	aFns

extractAndCompile = ( aFns, file, options, grunt )->
	for f in file.src

		_targetLangs = path.resolve( options.extractmsgpath ) 
		grunt.file.mkdir( options.extractmsgpath )
		
		for lang in options.languages
			do( lang )=>
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
			fName = path.basename(f, '.soy')
			msgFileFormat = fName + "_{LOCALE}.xlf"
			outputPathFormat = path.resolve( file.dest )[..-4] + "_{LOCALE}.js"
			grunt.log.writeln('Compile ' + f + ' to ' + file.dest[..-4] + "_{LOCALE}.js" + ' using languages ' + options.languages.join( ", " ) + ".")
			
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

		grunt.verbose.writeflags(options, 'Options')

		aFns = []

		grunt.file.mkdir( "tmp" )

		this.files.forEach ( file )->
			if changed.length is 0 or grunt.util._.intersection( file.src, changed ).length >= 1
				if not options.msgextract
					simpleCompile( aFns, file, options, grunt )
				else if options.msgextract and options.extractmsgpath
					extractAndCompile( aFns, file, options, grunt )
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