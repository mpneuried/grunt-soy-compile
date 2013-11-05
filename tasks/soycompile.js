(function() {
  var Compiler, exec, extractAndCompile, fs, path, simpleCompile, soyC, watchChanged,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  exec = require('child_process').exec;

  path = require("path");

  fs = require("fs");

  soyC = null;

  Compiler = (function() {
    function Compiler(grunt) {
      this.grunt = grunt;
      this._jarPathError = __bind(this._jarPathError, this);
      this._compile = __bind(this._compile, this);
      this.msg2js = __bind(this.msg2js, this);
      this.soy2msg = __bind(this.soy2msg, this);
      this.soy2js = __bind(this.soy2js, this);
      this.useIjData = __bind(this.useIjData, this);
      this.setJarPath = __bind(this.setJarPath, this);
      this.isUsingIjData = false;
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

    Compiler.prototype.useIjData = function() {
      this.isUsingIjData = true;
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
      if (this.isUsingIjData) {
        args.isUsingIjData = true;
      }
      this.grunt.verbose.writeflags(args, "Args");
      this._compile(this.soyCom, file, args, cb);
    };

    Compiler.prototype._compile = function(path, file, args, cb) {
      var key, val, _command,
        _this = this;
      _command = "java -jar " + path + " ";
      for (key in args) {
        val = args[key];
        if (this.grunt.util._.isBoolean(val) && val === true) {
          _command += "--" + key + " ";
        } else {
          _command += "--" + key + " " + val + " ";
        }
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
      this.grunt.fatal(_err);
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
            _target = _targetPath + "/" + fname + options.ext;
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
          var fnExtract, lang, _j, _len1, _ref1, _targetLangs;
          grunt.file.mkdir(options.extractmsgpath);
          _targetLangs = path.resolve(options.extractmsgpath);
          fnExtract = function(f, lang) {
            aFns.push(function(cba) {
              var msgFile;
              msgFile = path.basename(f, '.soy') + "_" + lang + ".xlf";
              grunt.log.writeln('Extract messages from ' + f + ' to ' + msgFile + ".");
              soyC.soy2msg(path.resolve(f), _targetLangs + "/" + msgFile, lang, options.sourceLang, cba);
            });
          };
          if (options.singleLangXLIFF != null) {
            fnExtract(f, options.singleLangXLIFF);
          } else {
            _ref1 = options.languages;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              lang = _ref1[_j];
              fnExtract(f, lang);
            }
          }
          return aFns.push(function(cba) {
            var fname, lng, msgFileFormat, outputPathFormat, _k, _langs, _len2, _ref2, _ref3, _ref4, _sourceLangs, _targetPath, _xlfFiles;
            _targetPath = path.resolve(file.dest).split(path.sep);
            _targetPath.pop();
            _targetPath = _targetPath.join(path.sep);
            fname = path.basename(f, ".soy");
            outputPathFormat = _targetPath + "/" + fname + "_{LOCALE}" + options.ext;
            if ((options.infusemsgpath != null) && (options.singleLangXLIFF != null)) {
              _sourceLangs = path.resolve(options.infusemsgpath);
              _xlfFiles = fs.readdirSync(_sourceLangs);
              if (_ref2 = "" + fname + "_" + options.singleLangXLIFF + ".xlf", __indexOf.call(_xlfFiles, _ref2) < 0) {
                grunt.fail.warn("Required XLIFF file `" + fname + "_" + options.singleLangXLIFF + ".xlf not found in path `" + _sourceLangs + "`");
                return;
              }
              _langs = options.languages;
            } else if (options.infusemsgpath != null) {
              _sourceLangs = path.resolve(options.infusemsgpath);
              _xlfFiles = fs.readdirSync(_sourceLangs);
              _langs = [];
              _ref3 = options.languages;
              for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
                lng = _ref3[_k];
                if (_ref4 = "" + fname + "_" + lng + ".xlf", __indexOf.call(_xlfFiles, _ref4) >= 0) {
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
            msgFileFormat = path.basename(f, '.soy') + "_{LOCALE}.xlf";
            grunt.log.debug(msgFileFormat);
            grunt.log.writeln('Compile ' + f + ' to ' + outputPathFormat.slice(process.cwd().length + 1) + ' using languages ' + _langs.join(", ") + "." + _sourceLangs);
            soyC.msg2js(path.resolve(f), _sourceLangs + "/" + msgFileFormat, outputPathFormat, _langs.join(","), cba);
          });
        })(f);
      }
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
      var aFns, changed, done, options, _ref,
        _this = this;
      if (watchChanged != null ? watchChanged.length : void 0) {
        changed = watchChanged;
        watchChanged = null;
      } else {
        changed = ((_ref = grunt.regarde) != null ? _ref.changed : void 0) || [];
      }
      grunt.log.debug("File filter: " + (JSON.stringify(changed)));
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
        ext: ".js"
      });
      soyC.setJarPath(options.jarPath);
      if (options.isUsingIjData) {
        soyC.useIjData();
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
      grunt.util.async.series(aFns, function(err, result) {
        if (err) {
          grunt.log.error(err);
          grunt.fail.warn('Soy failed to compile.');
        } else {
          grunt.log.debug("RESULTS", result);
        }
        done();
      });
    });
  };

}).call(this);
