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
			extractmsgpath: "relative/path/for/generated/xliffs",
			infusemsgpath: "relative/path/to/translated/xliffs"
		}
	}
}
```

For more examples on how to use the `expand` API shown in the `glob_to_multiple` example, see "Building the files object dynamically" in the grunt wiki entry [Configuring Tasks](http://gruntjs.com/configuring-tasks).

### Additional info

#### grunt-regards

- if you use `grunt-regards` instaed of `grunt-contrib-watch` to track chnaging files, the compiler will only compile the changed file.

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

## Todos

 * implement test cases to check for correct template generation.

## Release History
	
 * 2013-02-28   v0.1.3   Do not kill watch task on compile error; Added solution for differnet `jarPath` per develeoper to readme.
 * 2013-02-24   v0.1.0   Initial commit
