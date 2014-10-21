exec = require('child_process').exec
path = require( "path" )
fs = require( "fs" )

async = require( "async" )

soyC = null

# a compiling helper
class Compiler
	constructor: ( @grunt )->
		@compileflags = {}
		return

	# set the path to the jar files
	setJarPath: ( path )=>
		if path?.length
			@soyCom =  path + "/SoyToJsSrcCompiler.jar"
			@msgExt =  path + "/SoyMsgExtractor.jar"

			@grunt.verbose.writeflags( { compiler: @soyCom, msgext: @msgExt }, 'Jar Paths')
		else
			@_jarPathError()
		return

	addFlag: ( key, value )->
		@compileflags[ key ] = value
		return


	# compile a js template out of a soy file
	soy2js: ( file, output, cb )=>
		if not @soyCom
			@_jarPathError()
			return
		args = 
			outputPathFormat: output

		@grunt.verbose.writeflags( @compileflags, "Flags" )
		for _k, _v of @compileflags
			args[ _k ] = _v

		@grunt.verbose.writeflags( args, "SOY2JS Args" )
		@_compile( @soyCom, file, args, cb )

		return

	# extract xliff files out of the soy messgages
	soy2msg: ( file, output, lang, sourcelang, cb )=>
		if not @msgExt
			@_jarPathError()
			return
		args = 
			outputFile: output
			targetLocaleString: lang
			sourceLocaleString: sourcelang

		@grunt.verbose.writeflags( args, "SOY2MSG Args" )
		@_compile( @msgExt, file, args, cb )
		return

	# compile the soy file including localisation by the xliff files
	msg2js: ( file, fileFormat, output, langs, cb )=>
		if not @soyCom
			@_jarPathError()
			return
		args = 
			messageFilePathFormat: fileFormat
			outputPathFormat: output
			locales: langs

		@grunt.verbose.writeflags( @compileflags, "Flags" )
		for _k, _v of @compileflags
			args[ _k ] = _v

		@grunt.verbose.writeflags( args, "MSG2JS Args" )
		@_compile( @soyCom, file, args, cb )
		return

	# call java jar and return the results
	_compile: ( path, file, args, cb )=>
		_command = "java -jar #{ path } "
		for key, val of args
			if val is true
				_command += "--#{ key } "	
			else
				_command += "--#{ key } \"#{ val }\" "

		if Array.isArray( file )
			_command += "--srcs \"#{ file.join('","') }\" "
		else
			_command += "--srcs \"#{ file }\""

		@grunt.verbose.writeln( "EXEC:\n" + _command )

		exec _command, ( err, stdout, stderr )=>
			if err
				cb( err )
				return

			cb( null, stdout )
			return
		return

	# throw an error if the jar path has not been set
	_jarPathError: =>
		_err = new Error()
		_err.name = "missing-jar-path"
		_err.message = "Before using grunt-soy-compile you have to define the jar paths by settng the option `jarPath`"
		@grunt.fatal( _err )
		return

# function aggregator for non localized soy files
simpleCompile = ( aFns, file, options, grunt, fileFilter )->
	if file.orig.expand
		for f in file.src
			# filter if its a call during a regard file change
			if not fileFilter?.length or f.indexOf(fileFilter) >= 0
				do( f )=>
					# add a compile task
					aFns.push ( cba )->
						# calculate the final template file path
						_targetPath = path.resolve( file.dest ).split(path.sep)
						_targetPath.pop()
						_targetPath = _targetPath.join( path.sep )
						fname = path.basename( f, ".soy" )
						_target = _targetPath + "/" + fname + options.ext

						grunt.log.writeln('Compile ' + f + ' to ' + _target[process.cwd().length+1..] + ".")

						# run the soy compile 
						soyC.soy2js( path.resolve( f ), _target, cba )
						return
	else if file.src.length > 1
		aFns.push ( cba )->
			# calculate the final template file path
			_target = path.resolve( file.dest )

			grunt.log.writeln('Compile ' + file.src.join( "', '" ) + ' to ' + _target[process.cwd().length+1..] + ".")

			# run the soy compile 
			_files = []
			_files.push path.resolve( f ) for f in file.src
				
			soyC.soy2js( _files, _target, cba )
			return
	aFns

# function aggregator for localized soy files
extractAndCompile = ( aFns, file, options, grunt, fileFilter )->

	fnCompile = ( f )->
		# create target folder  if not exists
		grunt.file.mkdir( options.extractmsgpath )

		# set xliff targets
		_targetLangs = path.resolve( options.extractmsgpath ) 
		
		fnExtract = ( f, lang )->
			# add a extract task
			aFns.push ( cba )->

				# create path to the xliff file per language
				if Array.isArray( f )
					msgFile = path.basename(file.dest, '.js') + "_" + lang + ".xlf"
				else
					msgFile = path.basename(f, '.soy') + "_" + lang + ".xlf"

				grunt.log.writeln('Extract messages from ' + f + ' to ' + msgFile + ".")
				
				if Array.isArray( f )
					_files = []
					_files.push path.resolve( _file ) for _file in f
				else
					_files = path.resolve( f )

				# run the soy extract 
				soyC.soy2msg( _files, _targetLangs + "/" + msgFile, lang, options.sourceLang, cba )
				return
			return
		
		
		if options.singleLangXLIFF?
			fnExtract( f, options.singleLangXLIFF )
		else
			for lang in options.languages
				fnExtract( f, lang )
		


		# add a compile task
		aFns.push ( cba )->

			# calculate the final template file path
			_targetPath = path.resolve( file.dest ).split(path.sep)
			_targetPath.pop()
			_targetPath = _targetPath.join( path.sep )
			if Array.isArray( f )
				fname = path.basename( file.dest, ".js" )
			else
				fname = path.basename( f, ".soy" )
			outputPathFormat = _targetPath + "/" + fname + "_{LOCALE}" + options.ext
			# ceck if the xliff exports differ from the xliff imports
			
			if options.infusemsgpath? and options.singleLangXLIFF?
				_sourceLangs = path.resolve( options.infusemsgpath )
				_xlfFiles = fs.readdirSync( _sourceLangs )
				if "#{fname}_#{ options.singleLangXLIFF }.xlf" not in _xlfFiles
					grunt.fail.warn("Required XLIFF file `#{fname}_#{ options.singleLangXLIFF }.xlf not found in path `#{_sourceLangs}`");
					return
				_langs = options.languages

			else if options.infusemsgpath?
				_sourceLangs = path.resolve( options.infusemsgpath )
				_xlfFiles = fs.readdirSync( _sourceLangs )

				_langs = []
				for lng in options.languages
					if "#{fname}_#{ lng }.xlf" in _xlfFiles
						_langs.push( lng )
					else
						grunt.log.warn("XLIFF File `#{fname}_#{ lng }.xlf` not found so the language `#{lng}` will be skipped.")
			else
				_sourceLangs = _targetLangs
				_langs = options.languages

			grunt.log.debug(path.basename(f, '.soy') )

			# calculate the path to the xliff files
			
			msgFileFormat = fname + "_{LOCALE}.xlf"

			grunt.log.debug( msgFileFormat )
			if Array.isArray( f )
				grunt.log.writeln('Compile ' + f.join( "', '" ) + ' to ' + outputPathFormat[process.cwd().length+1..] + ' using languages ' + _langs.join( ", " ) + "." + _sourceLangs)
			else
				grunt.log.writeln('Compile ' + f + ' to ' + outputPathFormat[process.cwd().length+1..] + ' using languages ' + _langs.join( ", " ) + "." + _sourceLangs)

			if Array.isArray( f )
				_files = []
				_files.push path.resolve( _file ) for _file in f
			else
				_files = path.resolve( f )

			# run the soy compile 
			soyC.msg2js( _files, _sourceLangs + "/" + msgFileFormat, outputPathFormat, _langs.join( "," ), cba )
			return

	if file.orig.expand
		for f in file.src
			# filter if its a call during a regard file change
			if not fileFilter?.length or f in fileFilter
					fnCompile( f )

	else if file.src.length > 1
		fnCompile( file.src )
	
	aFns

# global handler to find changed files by `grunt-contrib-watch`
watchChanged = null
module.exports = ( grunt )->

	grunt.event.on 'watch', ( action,filepath  )->
		if action is "changed"
			watchChanged = [] if not watchChanged?
			watchChanged.push filepath
		return

	# init the compiler module
	soyC = new Compiler( grunt, path.resolve( __dirname + "/../_java/" ) )

	grunt.registerMultiTask "soycompile", "Compile soy files", ->

		if watchChanged?.length
			# get the changed `grunt-contrib-watch` file
			changed = watchChanged
			watchChanged = null
		else
			# get the changed files from the regarde task
			changed = grunt.regarde?.changed or []

		# set as async task
		done = this.async()

		grunt.log.debug( "File filter: #{ JSON.stringify( changed ) }")

		#grunt.log.debug( JSON.stringify( this ) )  

		# set default options
		options = this.options
			jarPath: null
			msgextract: false
			extractmsgpath: null
			infusemsgpath: null
			sourceLang: "en_GB"
			singleLangXLIFF: null
			languages: []
			ext: ".js"
			compileflags: {}

		# set the jsr path out of `options.jarPath`
		soyC.setJarPath( options.jarPath )
		
		if options.isUsingIjData
			grunt.log.warn( "`isUsingIjData` is deprecated. Please use the `compileflags` option." )
			soyC.addFlag( "isUsingIjData", true )

		if options.compileflags?
			for _k, _v of options.compileflags
				grunt.verbose.writeln( "Add Compile flag #{_k}:#{_v}" )
				soyC.addFlag( _k, _v )


		grunt.verbose.writeflags(options, 'Options')

		# collect the async function
		aFns = []

		this.files.forEach ( file )->
			if not options.msgextract
				simpleCompile( aFns, file, options, grunt, changed )
			else if options.msgextract and options.extractmsgpath?
				extractAndCompile( aFns, file, options, grunt, changed )
			else
				simpleCompile( aFns, file, options, grunt, changed )
			return		

		# run all collected compile tasks
		async.series aFns, ( err, result )=>
			if err
				grunt.log.error(err);
				grunt.fail.warn('Soy failed to compile.');
			else
				grunt.log.debug( "RESULTS", result )
			done()
			return


		return

	return