(function() {
  var exec, extractAndCompile, path, simpleCompile;

  exec = require('child_process').exec;

  path = require("path");

  simpleCompile = function(aFns, file, options, grunt) {
    var f, _i, _len, _ref;
    _ref = file.src;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      f = _ref[_i];
      aFns.push(function(cba) {
        var fName, _command, _target, _targetLangs,
          _this = this;
        _target = path.resolve(file.dest);
        grunt.log.writeln('Compile ' + f + ' to ' + file.dest + ".");
        fName = path.basename(f, '.soy');
        _targetLangs = path.resolve(options.extractmsgpath);
        grunt.file.mkdir("tmp/lang");
        _command = "java -jar " + options.soycompilerPath + " --outputPathFormat " + _target.slice(0, -3) + ".js " + (path.resolve(f));
        grunt.verbose.writeln(_command);
        exec(_command, function(err, stdout, stderr) {
          if (errgrunt) {
            cba(err);
            return;
          }
          cba(null, stdout);
        });
      });
    }
    return aFns;
  };

  extractAndCompile = function(aFns, file, options, grunt) {
    var f, _i, _len, _ref;
    _ref = file.src;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      f = _ref[_i];
      aFns.push(function(cba) {
        var fName, _command, _target,
          _this = this;
        _target = path.resolve(file.dest);
        grunt.log.writeln('Compile ' + f + ' to ' + file.dest + ".");
        fName = path.basename(f, '.soy');
        _command = "java -jar " + options.msgExtPath + " --outputFile " + _target.slice(0, -3) + ".js " + (path.resolve(f));
        grunt.verbose.writeln(_command);
        exec(_command, function(err, stdout, stderr) {
          if (errgrunt) {
            cba(err);
            return;
          }
          cba(null, stdout);
        });
      });
    }
    return aFns;
  };

  module.exports = function(grunt) {
    grunt.registerMultiTask("soycompile", "Compile soy files", function() {
      var aFns, done, options,
        _this = this;
      done = this.async();
      options = this.options({
        extract: false,
        extractmsgpath: null,
        infusemsgpath: null,
        languages: [],
        outputPathFormat: ""
      });
      grunt.verbose.writeflags(options, 'Options');
      options.msgExtPath = path.resolve(__dirname + "/../_java/SoyMsgExtractor.jar");
      options.soycompilerPath = path.resolve(__dirname + "/../_java/SoyToJsSrcCompiler.jar");
      grunt.verbose.writeflags({
        compiler: options.soycompilerPath,
        msgext: options.msgExtPath
      }, 'Jar Paths');
      aFns = [];
      grunt.file.mkdir("tmp");
      this.files.forEach(function(file) {
        if (!options.extract) {
          simpleCompile(aFns, file, options, grunt);
        } else if (options.extract && options.extractmsgpath) {
          extractAndCompile(aFns, file, options, grunt);
        }
      });
      grunt.util.async.parallel(aFns, function(err, result) {
        if (err) {
          grunt.fail.warn(err);
        } else {
          grunt.log.debug(result);
        }
        done();
      });
    });
  };

}).call(this);
