#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const browserify = require('browserify');
const glob = require('glob');
const postcss = require('postcss');
const cssnext = require('postcss-cssnext');
const csso = require('csso');
const exorcist = require('exorcist');

const cmd = process.argv[2];

if (cmd === 'js') {
  glob('./src/*.js', (err, files) => {
    if (err) {
      throw err;
    }

    files.map(entry => processFile(entry));

    function processFile(entry) {
      const filename = entry.split('/')[entry.split('/').length - 1];
      return browserify({entries: [entry], debug: true})
        .transform('babelify', {presets: ['es2015']})
        .transform('uglifyify')
        .bundle()
        .pipe(exorcist(path.join(__dirname, 'public', filename + '.map')))
        .pipe(fs.createWriteStream('public/' + filename));
    }
  });
} else if (cmd === 'css') {
  glob('./src/*.css', (err, files) => {
    if (err) {
      throw err;
    }

    files.forEach(processFile);

    function processFile(entry) {
      const filename = entry.split('/')[entry.split('/').length - 1];
      fs.readFile(entry, onFileRead);

      function onFileRead(err, css) {
        if (err) {
          throw err;
        }

        postcss([cssnext])
          .process(css, {from: entry, to: './public/' + filename})
          .then(minify);

        function minify(result) {
          fs.writeFile('./public/' + filename, csso.minify(result.css).css);
        }
      }
    }
  });
} else {
  console.error('usage: node tasks.js { js | css }');
  process.exit(1);
}
