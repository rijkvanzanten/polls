const fs = require('fs');
const browserify = require('browserify');
const glob = require('glob');

glob('./src/*.js', (err, files) => {
  if (err) {
    throw err;
  }
  files.map(entry => {
    const filename = entry.split('/')[entry.split('/').length - 1];
    return browserify({entries: [entry]})
      .transform('babelify', {presets: ['es2015']})
      .transform('uglifyify')
      .bundle()
      .pipe(fs.createWriteStream('public/' + filename));
  });
});
