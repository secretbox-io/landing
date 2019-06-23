const { src, dest, parallel, series, watch } = require('gulp');
const stylus = require('gulp-stylus');
const concat = require('gulp-concat');
const server = require('gulp-server-livereload');
const livereload = require('gulp-livereload');
const cleanCSS = require('gulp-clean-css');
const minify = require('gulp-minify');
const cleans = require('gulp-clean');
const nunjucks = require('gulp-nunjucks');
const njk = require('nunjucks');

// concatenates all minified js files to one app.min.js bundle
function cons() {
  return src([
      'src/js/jquery.custom.min.js',
      'src/js/menu.min.js',
      'src/js/swiper.custom.min.js',
  ], { sourcemaps: true })
    .pipe(concat('app.min.js'))
    .pipe(dest('dist/', { sourcemaps: true }))
}

// minifies all non-minified files
function min() {
  return src(['src/js/*.js', '!src/js/*.min.js', '!src/js/livereload.js'])
  .pipe(minify({
    ext:{
            src:'.js',
            min:'.min.js'
        },
    ignoreFiles: ['.min.js']
  }))
  .pipe(dest('src/js'))
}

// compiles stylus files, unminified for dev purpose
function css() {
  return src('./src/styles.styl')
    .pipe(stylus({
      'include css': true
    }))
    .pipe(dest('dist/'))
    //.pipe(livereload());
}

// production compliation of stylus files with minimization
function prodcss() {
  return src('./src/styles.styl')
    .pipe(stylus({
      'include css': true
    }))
    .pipe(cleanCSS({debug: true}, (details) => {
      console.log(`${details.name}: ${details.stats.originalSize}`);
      console.log(`${details.name}: ${details.stats.minifiedSize}`);
    }))
    .pipe(dest('dist/'))
}

// moves all html files to dist
function html() {
    return src(['./src/views/*'])
    .pipe(nunjucks.compile({
      env: new njk.Environment(new njk.FileSystemLoader('./src/views'))
    }))
    .pipe(dest('dist/'))
}

// watches all files to trigger processing
function watcher() {
    src('src/js/livereload.js')
    .pipe(dest('dist/'));

    watch(['./src/**/*.html'], { ignoreInitial: false }, html);
    watch(['./src/**/.js'], { ignoreInitial: false }, series(min, cons));
    watch(['./src/**/.styl'], { ignoreInitial: false }, css);
    watch(['./src/images/**'], { ignoreInitial: false }, images);
}

// moves all image assets to dist
function images() {
    return src('./src/images/**')
    .pipe(dest('./dist/images'));
}

// simple dev server with hot reload 
function srv() {
  return src('./dist')
  .pipe(server({
      livereload: true,
      open: true
    }));
}

function cleaner() {
  return src(['dist/*', 'dist/images'], {
    allowEmpty: true
  })
  .pipe(cleans());
}

exports.serve = parallel(watcher, srv);
exports.clean = cleaner;
exports.default = series(cleaner, parallel(series(min, cons), prodcss, html, images));