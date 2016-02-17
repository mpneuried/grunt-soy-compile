# grunt-soy-compile [![Build Status](https://secure.travis-ci.org/mpneuried/grunt-soy-compile.png?branch=master)](http://travis-ci.org/mpneuried/grunt-soy-compile)

> Compile soy template files including XLIFF language handling.

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-soy-compile --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-soy-compile');
```
*This plugin was designed to work with Grunt 0.4.x. If you're still using grunt v0.3.x it's strongly recommended that [you upgrade](http://gruntjs.com/upgrading-from-0.3-to-0.4)*

## Soy compile task

_Run this task with the `grunt soycompile` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

### Options

#### jarPath

**REQUIRED**

Type: `String`
Default: null

The path to the google clousure template comipler jar files.
Put the `SoyToJsSrcCompiler.jar` and `SoyMsgExtractor.jar` in one directory and set this `jarPath` option as absolute path to the containing folder.

You can download the **jar** files here:
- [ SoyToJsSrcCompiler ](http://closure-templates.googlecode.com/files/closure-templates-for-javascript-latest.zip)
- [ SoyMsgExtractor ](http://closure-templates.googlecode.com/files/closure-templates-msg-extractor-latest.zip)


#### ext

Type: `String`
Default: ".js"

The used file extension for the compiled template JS Files.

#### msgextract

Type: `Boolean`
Default: false

Use the message extractor to generate the xliff files out of the soy messages. This make only sense in combination with the `extractmsgpath` option.

#### extractmsgpath

Type: `String`
Default: null
*only relevant if `msgextract = true`*

The relative path to the folder in witch the xliff files will be generated.
**Note:** Soy overwrites the whole xliff file during every extraction. So it eventually makes sense to use the `infusemsgpath` option.

#### infusemsgpath

Type: `String`
Default: [ extractmsgpath ]
*only relevant if `msgextract = true`*

The relative path to the folder from wich the compiler grabs the xliff generated files. If this option has not been defined the `extractmsgpath` will be used.

**Info:** If you got a software to fill the generated xliff files with the translations you can use this option to generate the localized templates.

**Note:** If the soy compiler won't find a translation element within the xliff it uses the default defined within teh message.


#### sourceLang

Type: `String`
Default: "en_GB"
*only relevant if `msgextract = true`*

The source language you wrote your soy templates.

#### languages

Type: `Array`
Default: []
*only relevant if `msgextract = true`*

An array of languages the compiler will generate.

#### singleLangXLIFF

Type: `String`
Default: `null`
*only relevant if `msgextract = true`*

By setting this value to a language code of `languages` it will only generate one xliff file.

#### compileflags

Type: `Object`
Default: `null`

You can use this option to define your required compile flags. See [Javascrip useage docs](https://developers.google.com/closure/templates/docs/javascript_usage).

Example: 

	```
		src: ['test/tmpls/test.soy', 'test/tmpls/test.nr2.soy']
		dest: 'tmp/testCombined/flags.js'
		options:
			jarPath: "~/local/soy"
			compileflags:
				shouldGenerateJsdoc: true
				shouldProvideRequireSoyNamespaces: true
				shouldDeclareTopLevelNamespaces: true
				codeStyle: "concat"
	```


#### isUsingIjData [ deprecated ]

Type: `Boolean`
Default: `false`

Add's the compile param `--isUsingIjData`.

**NOTE:** This feature is deprecated. So please use the `compileflags` option.

### Usage Examples

#### simple

A simple example without using the extractor and soy translation features.

```js
soycompile: {
	mytask: {
		expand: true, 
		cwd: 'relative/path/to/sources',
		src: ["*.soy"],
		dest: "relative/path/for/results",
		options: {
			jarPath: "/absolute/path/to/the/jar/files"
		}
	}
}
```

#### to one file

A simple to compile multiple soy files into one single js file.

```js
soycompile: {
	mytask: {
		src: ['test/tmpls/**/*.soy']
		dest: 'relative/path/for/results/myTemplates.js'
		options: {
			jarPath: "/absolute/path/to/the/jar/files"
		}
	}
}
```


#### complex

A complex example using the extractor and soy translation features.

```js
	soycompile: {
		mytask: {
			expand: true, 
			cwd: 'relative/path/to/sources',
			src: ["*.soy"],
			dest: "relative/path/for/results",
			options: {
				jarPath: "/absolute/path/to/the/jar/files",
				msgextract: true,
				sourceLang: "en_GB",
				languages: [ "en_GB", "de_DE", "jp_JP" ],
				singleLangXLIFF: "de_DE"
				extractmsgpath: "relative/path/for/generated/xliffs",
				infusemsgpath: "relative/path/to/translated/xliffs"
			}
		}
	}
```

#### with `grunt-contrib-watch`

Instead of using `grunt-regard` you can also use `grunt-contrib-watch` to watch and only compile the changed soy file.

```js
grunt.initConfig(
	watch: {
		options: {
			spawn: false
		}
		templates: {
			files: ["relative/path/to/sources/*.soy"]
			tasks: [ "soycompile:templates" ]
		}
	},
	soycompile: {
		mytask: {
			src: ['test/tmpls/**/*.soy'],
			dest: 'relative/path/for/results/myTemplates.js',
			options: {
				jarPath: "/absolute/path/to/the/jar/files"
			}
		}
	}
);

grunt.event.on('watch', function(action, filepath, subtask) {
	var _tasks, _t, i, len, ref, task;
	// get the configured tasks to run and reconfig
	_tasks = grunt.config( "watch." + subtask + ".tasks" );
	if( !grunt.util._.isArray( _tasks ) ){
		_tasks = [ _tasks ];
	}
	for (i = 0, len = _tasks.length; i < len; i++) {
		task = _tasks[i];
		// change task format from `:` to `.`
		_t = task.split(":").join(".");
		// chnage the grunt config for each task if a `src` config exists
		if ((ref = grunt.config(_t + ".src")) != null ? ref.length : void 0) {
			grunt.config(_t + ".src", filepath);
		}
	}
});
```

**NOTE:** If you use the "to one file" Syntax ( using without `expand: true` ) the generated xliff files will also be generated info and are required to infuse by a single file per language ( e.g. `relative/path/for/generated/xliffs/myTemplates_de_de.xlf`, `relative/path/for/generated/xliffs/myTemplates_gb_en.xlf`, ... ).

For more examples on how to use the `expand` API shown in the `glob_to_multiple` example, see "Building the files object dynamically" in the grunt wiki entry [Configuring Tasks](http://gruntjs.com/configuring-tasks).

### Additional info

#### Compile only a single file

- if you use `grunt-regards` instead of `grunt-contrib-watch` to track chnaging files, the compiler will only compile the changed file.
- if you want to compile only the changed file by `grunt-contrib-watch` you have to define the watch option`options: { spawn: false }`, beause with a spawned task i can not catch the `changed` event through multiple threads.

#### Path restrictions

- It's not possibel to use a `,` within the paths to the grunt, xliff, soy or js files, because it's the java command file delimiter.

#### differnet `jarPaths`

If you have to define different paths to the jarFiles for differnet developers i use the folowing solution.
In many projects i define a file `config.json` to the root witch will be ignored by `.gitignore`. Within this file every developer can change the configutation for it's own development envorinment.

To set the jarPath i define something like that in the `config.json`.

```json
{
	"grunt":{
		"soyJarPath": "/Library/tcs_utils"
	}
}
```

Within the `Gruntfile.js` you set:

```js
// read the config file
var _conf = grunt.file.readJSON('config.json')

grunt.initConfig({
	soycompile: {
		mytask: {
			expand: true, 
			cwd: 'relative/path/to/sources',
			src: ["*.soy"],
			dest: "relative/path/for/results",
			options: {
				// define a deviating path in `config.json` under `...{ "soycompile":{"jarPath": "/absolute/path/to/another/jar/files"}}...`. Otherwise use a default.
				jarPath:  (typeof __conf !== "undefined" && __conf !== null ? (_ref = __conf.grunt) != null ? _ref.soyJarPath : void 0 : void 0) || "/absolute/path/to/the/jar/files",
			}
		}
	}
});
```




## Attention

You have to be carefull with filenames containing multiple dots!
I had this problem by uglifing my generated soy templates.
See this grunt [issue](https://github.com/gruntjs/grunt/pull/750) for more information and this [StackOverflow](http://stackoverflow.com/questions/16697344/configure-grunt-file-name-matching-for-files-with-multiple-dots) question for a solution.

## Todos

 * implement test cases to check for correct template generation.

## Release History
|Version|Date|Description|
|:--:|:--:|:--|
|v0.5.2|2014-03-28|Bugfix for correct handling of soy, msg and xliff folders with spaces. But it's not possible to use a `,`, because it's the java command file delimiter! |
|v0.6.0|2016-02-17|Made some changes to use it with 'grunt-contrib-watch`|
|v0.5.1|2013-11-22|Small bugfix for correct old `expand = true handling |
|v0.5.0|2013-02-26|Added handling to compile soyfiles to one js file ( Issue #5 ); Added `compileflags` to ba able to configure the Soy compiler jar ( Issue #6) |
|v0.4.1|2013-11-22|Updated dependencies to match Grunt 0.4.2 |
|v0.4.0|2013-10-05|Added compile options `ext` to define the generated file extension |
|v0.3.1|2013-08-16|Added compile param `isUsingIjData`|
|v0.3.0|2013-08-16|Added single file compile with `grunt-contrib-watch`, but only with the watch option `spawn: false`|
|v0.2.1|2013-07-11|Small bugfix|
|v0.2.0|2013-07-11|Added option `singleLangXLIFF` and a check  and skip for not existing xliff-files within the `infusemsgpath`.|
|v0.1.3|2013-02-28|Do not kill watch task on compile error; Added solution for differnet `jarPath` per develeoper to readme.|
|v0.1.0|2013-02-24|Initial commit|


## Related Projects
|Name|Description|
|:--|:--|
|[**soyer**](http://mpneuried.github.io/soyer/)|A node module to use soy files within node. with `soyer` it's possible to use different languages based on the soy message XLIFF files. |


## The MIT License (MIT)

Copyright © 2013 Mathias Peter, http://www.tcs.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
