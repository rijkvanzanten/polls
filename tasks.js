const fs = require('fs');
const browserify = require('browserify');
const glob = require('glob');
const postcss = require('postcss');
const cssnext = require('postcss-cssnext');
const csso = require('csso');

glob('./src/*.js', (err, files) => {
  if (err) {
    throw err;
  }

  files.map(entry => processFile(entry));

  function processFile(entry) {
    const filename = entry.split('/')[entry.split('/').length - 1];
    return browserify({entries: [entry]})
      .transform('babelify', {presets: ['es2015']})
      .transform('uglifyify')
      .bundle()
      .pipe(fs.createWriteStream('public/' + filename));
  }
});

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
