(function() {
  var Compiler, exec, extractAndCompile, path, simpleCompile, soyC,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  exec = require('child_process').exec;

  path = require("path");

  soyC = null;

  Compiler = (function() {

    function Compiler(grunt) {
      this.grunt = grunt;
      this._jarPathError = __bind(this._jarPathError, this);
      this._compile = __bind(this._compile, this);
      this.msg2js = __bind(this.msg2js, this);
      this.soy2msg = __bind(this.soy2msg, this);
      this.soy2js = __bind(this.soy2js, this);
      this.setJarPath = __bind(this.setJarPath, this);
      return;
    }

    Compiler.prototype.setJarPath = function(path) {
      if (path != null ? path.length : void 0) {
        this.soyCom = path + "/SoyToJsSrcCompiler.jar";
        this.msgExt = path + "/SoyMsgExtractor.jar";
        this.grunt.verbose.writeflags({
          compiler: this.soyCom,
          msgext: this.msgExt
        }, 'Jar Paths');
      } else {
        this._jarPathError();
      }
    };

    Compiler.prototype.soy2js = function(file, output, cb) {
      var args;
      if (!this.soyCom) {
        this._jarPathError();
        return;
      }
      args = {
        outputPathFormat: output
      };
      this.grunt.verbose.writeflags(args, "Args");
      this._compile(this.soyCom, file, args, cb);
    };

    Compiler.prototype.soy2msg = function(file, output, lang, sourcelang, cb) {
      var args;
      if (!this.msgExt) {
        this._jarPathError();
        return;
      }
      args = {
        outputFile: output,
        targetLocaleString: lang,
        sourceLocaleString: sourcelang
      };
      this.grunt.verbose.writeflags(args, "Args");
      this._compile(this.msgExt, file, args, cb);
    };

    Compiler.prototype.msg2js = function(file, fileFormat, output, langs, cb) {
      var args;
      if (!this.soyCom) {
        this._jarPathError();
        return;
      }
      args = {
        messageFilePathFormat: fileFormat,
        outputPathFormat: output,
        locales: langs
      };
      this.grunt.verbose.writeflags(args, "Args");
      this._compile(this.soyCom, file, args, cb);
    };

    Compiler.prototype._compile = function(path, file, args, cb) {
      var key, val, _command,
        _this = this;
      _command = "java -jar " + path + " ";
      for (key in args) {
        val = args[key];
        _command += "--" + key + " " + val + " ";
      }
      _command += file;
      this.grunt.verbose.writeln(_command);
      exec(_command, function(err, stdout, stderr) {
        if (err) {
          cb(err);
          return;
        }
        cb(null, stdout);
      });
    };

    Compiler.prototype._jarPathError = function() {
      var _err;
      _err = new Error();
      _err.name = "missing-jar-path";
      _err.message = "Before using grunt-soy-compile you have to define the jar paths by settng the option `jarPath`";
      this.grunt.fail.fatal(_err);
    };

    return Compiler;

  })();

  simpleCompile = function(aFns, file, options, grunt, fileFilter) {
    var f, _i, _len, _ref,
      _this = this;
    _ref = file.src;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      f = _ref[_i];
      if (!(fileFilter != null ? fileFilter.length : void 0) || __indexOf.call(fileFilter, f) >= 0) {
        (function(f) {
          return aFns.push(function(cba) {
            var fname, _target, _targetPath;
            _targetPath = path.resolve(file.dest).split(path.sep);
            _targetPath.pop();
            _targetPath = _targetPath.join(path.sep);
            fname = path.basename(f, ".soy");
            _target = _targetPath + "/" + fname + ".js";
            grunt.log.writeln('Compile ' + f + ' to ' + _target.slice(process.cwd().length + 1) + ".");
            soyC.soy2js(path.resolve(f), _target, cba);
          });
        })(f);
      }
    }
    return aFns;
  };

  extractAndCompile = function(aFns, file, options, grunt, fileFilter) {
    var f, _i, _len, _ref;
    _ref = file.src;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      f = _ref[_i];
      if (!(fileFilter != null ? fileFilter.length : void 0) || __indexOf.call(fileFilter, f) >= 0) {
        (function(f) {
          var lang, _fn, _j, _len1, _ref1, _sourceLangs, _targetLangs,
            _this = this;
          grunt.file.mkdir(options.extractmsgpath);
          _targetLangs = path.resolve(options.extractmsgpath);
          _ref1 = options.languages;
          _fn = function(f, lang) {
            return aFns.push(function(cba) {
              var msgFile;
              msgFile = path.basename(f, '.soy') + "_" + lang + ".xlf";
              grunt.log.writeln('Extract messages from ' + f + ' to ' + msgFile + ".");
              soyC.soy2msg(path.resolve(f), _targetLangs + "/" + msgFile, lang, options.sourceLang, cba);
            });
          };
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            lang = _ref1[_j];
            _fn(f, lang);
          }
          if (options.infusemsgpath != null) {
            _sourceLangs = path.resolve(options.infusemsgpath);
          } else {
            _sourceLangs = _targetLangs;
          }
          return aFns.push(function(cba) {
            var fname, msgFileFormat, outputPathFormat, _targetPath;
            _targetPath = path.resolve(file.dest).split(path.sep);
            _targetPath.pop();
            _targetPath = _targetPath.join(path.sep);
            fname = path.basename(f, ".soy");
            outputPathFormat = _targetPath + "/" + fname + "_{LOCALE}.js";
            msgFileFormat = path.basename(f, '.soy') + "_{LOCALE}.xlf";
            grunt.log.writeln('Compile ' + f + ' to ' + outputPathFormat.slice(process.cwd().length + 1) + ' using languages ' + options.languages.join(", ") + ".");
            soyC.msg2js(path.resolve(f), _sourceLangs + "/" + msgFileFormat, outputPathFormat, options.languages.join(","), cba);
          });
        })(f);
      }
    }
    return aFns;
  };

  module.exports = function(grunt) {
    soyC = new Compiler(grunt, path.resolve(__dirname + "/../_java/"));
    grunt.registerMultiTask("soycompile", "Compile soy files", function() {
      var aFns, changed, done, options, _ref,
        _this = this;
      changed = ((_ref = grunt.regarde) != null ? _ref.changed : void 0) || [];
      done = this.async();
      options = this.options({
        jarPath: null,
        msgextract: false,
        extractmsgpath: null,
        infusemsgpath: null,
        sourceLang: "en_GB",
        languages: []
      });
      soyC.setJarPath(options.jarPath);
      grunt.verbose.writeflags(options, 'Options');
      aFns = [];
      this.files.forEach(function(file) {
        if (!options.msgextract) {
          simpleCompile(aFns, file, options, grunt, changed);
        } else if (options.msgextract && (options.extractmsgpath != null)) {
          extractAndCompile(aFns, file, options, grunt, changed);
        } else {
          simpleCompile(aFns, file, options, grunt, changed);
        }
      });
      grunt.util.async.series(aFns, function(err, result) {
        if (err) {
          grunt.fail.warn(err);
        } else {
          grunt.log.debug("RESULTS", result);
        }
        done();
      });
    });
  };

}).call(this);
