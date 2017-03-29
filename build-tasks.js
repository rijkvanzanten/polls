#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');
const browserify = require('browserify');
const concat = require('concat-stream');
const esprima = require('esprima');
const esmangle = require('esmangle');
const escodegen = require('escodegen');

const cmd = process.argv[2];
if (cmd === 'build') {
  build({watch: false});
} else if (cmd === 'watch') {
  build({watch: true});
} else {
  usage(1);
}

function build() {
  glob('./src/*.js', (err, files) => {
    files.forEach(file => {
      const fileArray = file.split('/');
      const filename = fileArray[fileArray.length - 1];

      browserify(file)
        .transform('babelify', {presets: ['es2015']})
        .bundle()
        .pipe(concat(buffer => onconcat(buffer, filename)));
    });
  });

  function onconcat(buffer, filename) {
    const ast = esprima.parse(buffer.toString());
    const optimized = esmangle.optimize(ast, null);
    const result = esmangle.mangle(optimized);
    const code = escodegen.generate(result, {
      format: {
        renumber: true,
        hexadecimal: true,
        escapeless: true,
        compact: true,
        semicolons: false,
        parentheses: false
      }
    });
    fs.writeFile('./public/' + filename, code, onerror);

    function onerror(err) {
      if (err) {
        console.log('hij gaat bad', err);
      }
    }
  }
}

function usage(code) {
  console.error('usage: ./task.js { build | watch }');
  if (code) {
    process.exit(code);
  }
}
