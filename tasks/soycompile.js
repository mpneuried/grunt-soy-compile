(function() {
  var Compiler, async, exec, extractAndCompile, fs, path, simpleCompile, soyC, watchChanged,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  exec = require('child_process').exec;

  path = require("path");

  fs = require("fs");

  async = require("async");

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
      this.compileflags = {};
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

    Compiler.prototype.addFlag = function(key, value) {
      this.compileflags[key] = value;
    };

    Compiler.prototype.soy2js = function(file, output, cb) {
      var args, _k, _ref, _v;
      if (!this.soyCom) {
        this._jarPathError();
        return;
      }
      args = {
        outputPathFormat: output
      };
      this.grunt.verbose.writeflags(this.compileflags, "Flags");
      _ref = this.compileflags;
      for (_k in _ref) {
        _v = _ref[_k];
        args[_k] = _v;
      }
      this.grunt.verbose.writeflags(args, "SOY2JS Args");
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
      this.grunt.verbose.writeflags(args, "SOY2MSG Args");
      this._compile(this.msgExt, file, args, cb);
    };

    Compiler.prototype.msg2js = function(file, fileFormat, output, langs, cb) {
      var args, _k, _ref, _v;
      if (!this.soyCom) {
        this._jarPathError();
        return;
      }
      args = {
        messageFilePathFormat: fileFormat,
        outputPathFormat: output,
        locales: langs
      };
      this.grunt.verbose.writeflags(this.compileflags, "Flags");
      _ref = this.compileflags;
      for (_k in _ref) {
        _v = _ref[_k];
        args[_k] = _v;
      }
      this.grunt.verbose.writeflags(args, "MSG2JS Args");
      this._compile(this.soyCom, file, args, cb);
    };

    Compiler.prototype._compile = function(path, file, args, cb) {
      var key, val, _command;
      _command = "java -jar " + path + " ";
      for (key in args) {
        val = args[key];
        if (val === true) {
          _command += "--" + key + " ";
        } else {
          _command += "--" + key + " \"" + val + "\" ";
        }
      }
      if (Array.isArray(file)) {
        _command += "--srcs \"" + (file.join('","')) + "\" ";
      } else {
        _command += "--srcs \"" + file + "\"";
      }
      this.grunt.verbose.writeln("EXEC:\n" + _command);
      exec(_command, (function(_this) {
        return function(err, stdout, stderr) {
          if (err) {
            cb(err);
            return;
          }
          cb(null, stdout);
        };
      })(this));
    };

    Compiler.prototype._jarPathError = function() {
      var _err;
      _err = new Error();
      _err.name = "missing-jar-path";
      _err.message = "Before using grunt-soy-compile you have to define the jar paths by settng the option `jarPath`";
      this.grunt.fatal(_err);
    };

    return Compiler;

  })();

  simpleCompile = function(aFns, file, options, grunt, fileFilter) {
    var f, _i, _len, _ref;
    if (file.orig.expand) {
      _ref = file.src;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        if (!(fileFilter != null ? fileFilter.length : void 0) || f.indexOf(fileFilter) >= 0) {
          (function(_this) {
            return (function(f) {
              return aFns.push(function(cba) {
                var fname, _target, _targetPath;
                _targetPath = path.resolve(file.dest).split(path.sep);
                _targetPath.pop();
                _targetPath = _targetPath.join(path.sep);
                fname = path.basename(f, ".soy");
                _target = _targetPath + "/" + fname + options.ext;
                grunt.log.writeln('Compile ' + f + ' to ' + _target.slice(process.cwd().length + 1) + ".");
                soyC.soy2js(path.resolve(f), _target, cba);
              });
            });
          })(this)(f);
        }
      }
    } else if (file.src.length > 1) {
      aFns.push(function(cba) {
        var _files, _j, _len1, _ref1, _target;
        _target = path.resolve(file.dest);
        grunt.log.writeln('Compile ' + file.src.join("', '") + ' to ' + _target.slice(process.cwd().length + 1) + ".");
        _files = [];
        _ref1 = file.src;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          f = _ref1[_j];
          _files.push(path.resolve(f));
        }
        soyC.soy2js(_files, _target, cba);
      });
    }
    return aFns;
  };

  extractAndCompile = function(aFns, file, options, grunt, fileFilter) {
    var f, fnCompile, _i, _len, _ref;
    fnCompile = function(f) {
      var fnExtract, lang, _i, _len, _ref, _targetLangs;
      grunt.file.mkdir(options.extractmsgpath);
      _targetLangs = path.resolve(options.extractmsgpath);
      fnExtract = function(f, lang) {
        aFns.push(function(cba) {
          var msgFile, _file, _files, _i, _len;
          if (Array.isArray(f)) {
            msgFile = path.basename(file.dest, '.js') + "_" + lang + ".xlf";
          } else {
            msgFile = path.basename(f, '.soy') + "_" + lang + ".xlf";
          }
          grunt.log.writeln('Extract messages from ' + f + ' to ' + msgFile + ".");
          if (Array.isArray(f)) {
            _files = [];
            for (_i = 0, _len = f.length; _i < _len; _i++) {
              _file = f[_i];
              _files.push(path.resolve(_file));
            }
          } else {
            _files = path.resolve(f);
          }
          soyC.soy2msg(_files, _targetLangs + "/" + msgFile, lang, options.sourceLang, cba);
        });
      };
      if (options.singleLangXLIFF != null) {
        fnExtract(f, options.singleLangXLIFF);
      } else {
        _ref = options.languages;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          lang = _ref[_i];
          fnExtract(f, lang);
        }
      }
      return aFns.push(function(cba) {
        var fname, lng, msgFileFormat, outputPathFormat, _file, _files, _j, _k, _langs, _len1, _len2, _ref1, _ref2, _ref3, _sourceLangs, _targetPath, _xlfFiles;
        _targetPath = path.resolve(file.dest).split(path.sep);
        _targetPath.pop();
        _targetPath = _targetPath.join(path.sep);
        if (Array.isArray(f)) {
          fname = path.basename(file.dest, ".js");
        } else {
          fname = path.basename(f, ".soy");
        }
        outputPathFormat = _targetPath + "/" + fname + "_{LOCALE}" + options.ext;
        if ((options.infusemsgpath != null) && (options.singleLangXLIFF != null)) {
          _sourceLangs = path.resolve(options.infusemsgpath);
          _xlfFiles = fs.readdirSync(_sourceLangs);
          if (_ref1 = "" + fname + "_" + options.singleLangXLIFF + ".xlf", __indexOf.call(_xlfFiles, _ref1) < 0) {
            grunt.fail.warn("Required XLIFF file `" + fname + "_" + options.singleLangXLIFF + ".xlf not found in path `" + _sourceLangs + "`");
            return;
          }
          _langs = options.languages;
        } else if (options.infusemsgpath != null) {
          _sourceLangs = path.resolve(options.infusemsgpath);
          _xlfFiles = fs.readdirSync(_sourceLangs);
          _langs = [];
          _ref2 = options.languages;
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            lng = _ref2[_j];
            if (_ref3 = "" + fname + "_" + lng + ".xlf", __indexOf.call(_xlfFiles, _ref3) >= 0) {
              _langs.push(lng);
            } else {
              grunt.log.warn("XLIFF File `" + fname + "_" + lng + ".xlf` not found so the language `" + lng + "` will be skipped.");
            }
          }
        } else {
          _sourceLangs = _targetLangs;
          _langs = options.languages;
        }
        grunt.log.debug(path.basename(f, '.soy'));
        msgFileFormat = fname + "_{LOCALE}.xlf";
        grunt.log.debug(msgFileFormat);
        if (Array.isArray(f)) {
          grunt.log.writeln('Compile ' + f.join("', '") + ' to ' + outputPathFormat.slice(process.cwd().length + 1) + ' using languages ' + _langs.join(", ") + "." + _sourceLangs);
        } else {
          grunt.log.writeln('Compile ' + f + ' to ' + outputPathFormat.slice(process.cwd().length + 1) + ' using languages ' + _langs.join(", ") + "." + _sourceLangs);
        }
        if (Array.isArray(f)) {
          _files = [];
          for (_k = 0, _len2 = f.length; _k < _len2; _k++) {
            _file = f[_k];
            _files.push(path.resolve(_file));
          }
        } else {
          _files = path.resolve(f);
        }
        soyC.msg2js(_files, _sourceLangs + "/" + msgFileFormat, outputPathFormat, _langs.join(","), cba);
      });
    };
    if (file.orig.expand) {
      _ref = file.src;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        if (!(fileFilter != null ? fileFilter.length : void 0) || __indexOf.call(fileFilter, f) >= 0) {
          fnCompile(f);
        }
      }
    } else if (file.src.length > 1) {
      fnCompile(file.src);
    }
    return aFns;
  };

  watchChanged = null;

  module.exports = function(grunt) {
    grunt.event.on('watch', function(action, filepath) {
      if (action === "changed") {
        if (watchChanged == null) {
          watchChanged = [];
        }
        watchChanged.push(filepath);
      }
    });
    soyC = new Compiler(grunt, path.resolve(__dirname + "/../_java/"));
    grunt.registerMultiTask("soycompile", "Compile soy files", function() {
      var aFns, changed, done, options, _k, _ref, _ref1, _v;
      if (watchChanged != null ? watchChanged.length : void 0) {
        changed = watchChanged;
        watchChanged = null;
      } else {
        changed = ((_ref = grunt.regarde) != null ? _ref.changed : void 0) || [];
      }
      done = this.async();
      grunt.log.debug("File filter: " + (JSON.stringify(changed)));
      options = this.options({
        jarPath: null,
        msgextract: false,
        extractmsgpath: null,
        infusemsgpath: null,
        sourceLang: "en_GB",
        singleLangXLIFF: null,
        languages: [],
        ext: ".js",
        compileflags: {}
      });
      soyC.setJarPath(options.jarPath);
      if (options.isUsingIjData) {
        grunt.log.warn("`isUsingIjData` is deprecated. Please use the `compileflags` option.");
        soyC.addFlag("isUsingIjData", true);
      }
      if (options.compileflags != null) {
        _ref1 = options.compileflags;
        for (_k in _ref1) {
          _v = _ref1[_k];
          grunt.verbose.writeln("Add Compile flag " + _k + ":" + _v);
          soyC.addFlag(_k, _v);
        }
      }
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
      async.series(aFns, (function(_this) {
        return function(err, result) {
          if (err) {
            grunt.log.error(err);
            grunt.fail.warn('Soy failed to compile.');
          } else {
            grunt.log.debug("RESULTS", result);
          }
          done();
        };
      })(this));
    });
  };

}).call(this);
