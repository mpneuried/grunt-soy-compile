(function() {
  var Compiler, async, exec, extractAndCompile, fs, path, simpleCompile, soyC, watchChanged,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  exec = require('child_process').exec;

  path = require("path");

  fs = require("fs");

  async = require("async");

  soyC = null;

  Compiler = (function() {
    function Compiler(grunt1) {
      this.grunt = grunt1;
      this._jarPathError = bind(this._jarPathError, this);
      this._compile = bind(this._compile, this);
      this.msg2js = bind(this.msg2js, this);
      this.soy2msg = bind(this.soy2msg, this);
      this.soy2js = bind(this.soy2js, this);
      this.setJarPath = bind(this.setJarPath, this);
      this.compileflags = {};
      return;
    }

    Compiler.prototype.setJarPath = function(path) {
      this.grunt.verbose.writeln("setJarPath");
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
      this.grunt.verbose.writeln("addFlag");
      this.compileflags[key] = value;
    };

    Compiler.prototype.soy2js = function(file, output, cb) {
      var _k, _v, args, ref;
      this.grunt.verbose.writeln("soy2js");
      if (!this.soyCom) {
        this._jarPathError();
        return;
      }
      args = {
        outputPathFormat: output
      };
      this.grunt.verbose.writeflags(this.compileflags, "Flags");
      ref = this.compileflags;
      for (_k in ref) {
        _v = ref[_k];
        args[_k] = _v;
      }
      this.grunt.verbose.writeflags(args, "SOY2JS Args");
      this._compile(this.soyCom, file, args, cb);
    };

    Compiler.prototype.soy2msg = function(file, output, lang, sourcelang, cb) {
      var args;
      this.grunt.verbose.writeln("soy2msg");
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
      var _k, _v, args, ref;
      this.grunt.verbose.writeln("msg2js");
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
      ref = this.compileflags;
      for (_k in ref) {
        _v = ref[_k];
        args[_k] = _v;
      }
      this.grunt.verbose.writeflags(args, "MSG2JS Args");
      this._compile(this.soyCom, file, args, cb);
    };

    Compiler.prototype._compile = function(path, file, args, cb) {
      var _command, key, val;
      this.grunt.verbose.writeln("_compile");
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
      this.grunt.verbose.writeln("_jarPathError");
      _err = new Error();
      _err.name = "missing-jar-path";
      _err.message = "Before using grunt-soy-compile you have to define the jar paths by settng the option `jarPath`";
      this.grunt.fatal(_err);
    };

    return Compiler;

  })();

  simpleCompile = function(aFns, file, options, grunt, fileFilter) {
    var f, i, len, ref, ref1;
    if (Array.isArray(file.src) && file.expand || ((ref = file.orig) != null ? ref.expand : void 0)) {
      ref1 = file.src;
      for (i = 0, len = ref1.length; i < len; i++) {
        f = ref1[i];
        if (!(fileFilter != null ? fileFilter.length : void 0) || f.indexOf(fileFilter) >= 0) {
          (function(_this) {
            return (function(f) {
              return aFns.push(function(cba) {
                var _target, _targetPath, fname;
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
        var _files, _target, j, len1, ref2;
        _target = path.resolve(file.dest);
        grunt.log.writeln('Compile ' + file.src.join("', '") + ' to ' + _target.slice(process.cwd().length + 1) + ".");
        _files = [];
        ref2 = file.src;
        for (j = 0, len1 = ref2.length; j < len1; j++) {
          f = ref2[j];
          _files.push(path.resolve(f));
        }
        soyC.soy2js(_files, _target, cba);
      });
    }
    return aFns;
  };

  extractAndCompile = function(aFns, file, options, grunt, fileFilter) {
    var f, fnCompile, i, len, ref, ref1;
    fnCompile = function(f) {
      var _targetLangs, fnExtract, i, lang, len, ref;
      grunt.file.mkdir(options.extractmsgpath);
      _targetLangs = path.resolve(options.extractmsgpath);
      fnExtract = function(f, lang) {
        aFns.push(function(cba) {
          var _file, _files, i, len, msgFile;
          if (Array.isArray(f)) {
            msgFile = path.basename(file.dest, '.js') + "_" + lang + ".xlf";
          } else {
            msgFile = path.basename(f, '.soy') + "_" + lang + ".xlf";
          }
          grunt.log.writeln('Extract messages from ' + f + ' to ' + msgFile + ".");
          if (Array.isArray(f)) {
            _files = [];
            for (i = 0, len = f.length; i < len; i++) {
              _file = f[i];
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
        ref = options.languages;
        for (i = 0, len = ref.length; i < len; i++) {
          lang = ref[i];
          fnExtract(f, lang);
        }
      }
      return aFns.push(function(cba) {
        var _file, _files, _langs, _sourceLangs, _targetPath, _xlfFiles, fname, j, k, len1, len2, lng, msgFileFormat, outputPathFormat, ref1, ref2, ref3;
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
          if (ref1 = fname + "_" + options.singleLangXLIFF + ".xlf", indexOf.call(_xlfFiles, ref1) < 0) {
            grunt.fail.warn("Required XLIFF file `" + fname + "_" + options.singleLangXLIFF + ".xlf not found in path `" + _sourceLangs + "`");
            return;
          }
          _langs = options.languages;
        } else if (options.infusemsgpath != null) {
          _sourceLangs = path.resolve(options.infusemsgpath);
          _xlfFiles = fs.readdirSync(_sourceLangs);
          _langs = [];
          ref2 = options.languages;
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            lng = ref2[j];
            if (ref3 = fname + "_" + lng + ".xlf", indexOf.call(_xlfFiles, ref3) >= 0) {
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
          for (k = 0, len2 = f.length; k < len2; k++) {
            _file = f[k];
            _files.push(path.resolve(_file));
          }
        } else {
          _files = path.resolve(f);
        }
        soyC.msg2js(_files, _sourceLangs + "/" + msgFileFormat, outputPathFormat, _langs.join(","), cba);
      });
    };
    if (Array.isArray(file.src) && file.expand || ((ref = file.orig) != null ? ref.expand : void 0)) {
      ref1 = file.src;
      for (i = 0, len = ref1.length; i < len; i++) {
        f = ref1[i];
        if (!(fileFilter != null ? fileFilter.length : void 0) || indexOf.call(fileFilter, f) >= 0) {
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
      var _k, _v, aFns, addFile, changed, done, options, ref, ref1, ref2;
      if (watchChanged != null ? watchChanged.length : void 0) {
        changed = watchChanged;
        watchChanged = null;
      } else {
        changed = ((ref = grunt.regarde) != null ? ref.changed : void 0) || [];
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
        ref1 = options.compileflags;
        for (_k in ref1) {
          _v = ref1[_k];
          grunt.verbose.writeln("Add Compile flag " + _k + ":" + _v);
          soyC.addFlag(_k, _v);
        }
      }
      grunt.verbose.writeflags(options, 'Options');
      aFns = [];
      addFile = function(file) {
        if (!options.msgextract) {
          simpleCompile(aFns, file, options, grunt, changed);
        } else if (options.msgextract && (options.extractmsgpath != null)) {
          extractAndCompile(aFns, file, options, grunt, changed);
        } else {
          simpleCompile(aFns, file, options, grunt, changed);
        }
      };
      if ((ref2 = this.files) != null ? ref2.length : void 0) {
        this.files.forEach(addFile);
      } else {
        addFile(this.data);
      }
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
