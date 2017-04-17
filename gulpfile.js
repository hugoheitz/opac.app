var gulp = require('gulp');
var browserSync = require('browser-sync');
var cp = require('child_process');
var del = require('del');
var replace = require('gulp-replace');
var gutil = require('gulp-util');
var print = require('gulp-print');
var fs = require('fs');
var less = require('gulp-less');
var path = require('path');
var LessAutoprefix = require('less-plugin-autoprefix');
var autoprefix = new LessAutoprefix({ browsers: [
    'Android >= 4',
    'Chrome >= 20',
    'Firefox >= 24', // Firefox 24 is the latest ESR
    'Explorer >= 9',
    'iOS >= 6',
    'Opera >= 16',
    'Safari >= 6'
] });
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');
var imageResize = require('gulp-image-resize');
var changed = require("gulp-changed");
var walk = function (dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) results = results.concat(walk(file));
        else results.push(file)
    });
    return results
};
var getEmptyFolders = function(dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getEmptyFolders(file));
            if (getFileCount(file) == 0) {
                results.push(file);
            }
        }
    });
    return results;
};
var getFileCount = function(dir) {
    var filesCount = 0;
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) filesCount += getFileCount(file);
        else filesCount ++;
    });
    return filesCount;
};
var jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};
var jekyllBuild = function(dir, done) {
    browserSync.notify(messages.jekyllBuild);
    gulp.src('shared/**/*')
        .pipe(gulp.dest(dir)).on('end', function () {
        cp.spawn(jekyll, ['build'], {stdio: 'inherit', cwd: dir})
            .on('close', function () {
                var files_shared = walk('shared');
                for (var i = 0; i < files_shared.length; i++) {
                    files_shared[i] = dir + files_shared[i].substring('shared'.length)
                }
                del(files_shared).then(function (paths) {
                    var empty_folders = getEmptyFolders(dir);
                    del(empty_folders).then(function (paths) {
                        done();
                    });
                });
            });
    });
};
/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build-de', ['less-de'], function (done) {
    jekyllBuild('de', done);
});
/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild-de', ['jekyll-build-de'], function () {
    browserSync.reload();
});
/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build-en', ['less-en'], function (done) {
    jekyllBuild('en', done);
});
/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild-en', ['jekyll-build-en'], function () {
    browserSync.reload();
});
/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync-de', ['jekyll-build-de'], function () {
    browserSync({
        server: {
            baseDir: '_site/de'
        },
        online: false
    });
});
/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync-en', ['jekyll-build-en'], function () {
    browserSync({
        server: {
            baseDir: '_site/en'
        },
        online: false
    });
});
var buildLess = function(dir) {
    return gulp.src('./shared/less/flat-ui.less')
        .pipe(less({
            paths: [ path.join(__dirname, 'less', 'mixins'), path.join(__dirname, 'less', 'modules') ],
            plugins: [autoprefix]
        }))
        .pipe(cssmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('_site/' + dir + '/css'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('shared/css'));
};
gulp.task('less-de', function () {
    return buildLess('de')
});
gulp.task('less-en', function () {
    return buildLess('en')
});
/**
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch-de', function () {
    gulp.watch(['./shared/less/**/*.less'], ['less-de']);
    gulp.watch(['./shared/*.html', './shared/*.md',
        './de/*.html', './de/*.md', './de/_layouts/*.html', './de/_posts/*.md',
        './de/css/custom.css', './de/js/*.js', './de/_includes/*.html',
        './shared/_layouts/*.html', '_posts/*', './shared/_includes/*.html',
        '_config.yml', 'shared/css/main.css'], ['jekyll-rebuild-de']);
});
/**
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch-en', function () {
    gulp.watch(['./shared/less/**/*.less'], ['less-en']);
    gulp.watch(['./shared/*.html', './shared/*.md',
        './en/*.html', './en/*.md', './en/_layouts/*.html', './en/_posts/*.md',
        './en/css/custom.css', './en/js/*.js', './en/_includes/*.html',
        './shared/_layouts/*.html', '_posts/*', './shared/_includes/*.html',
        '_config.yml', 'shared/css/main.css'], ['jekyll-rebuild-en']);
});
/**
 * Default task, running just `gulp` will compile the
 * jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default-en', ['browser-sync-en', 'watch-en']);
gulp.task('default-de', ['browser-sync-en', 'watch-de']);
gulp.task('build-en', ['jekyll-build-en']);
gulp.task('build-de', ['jekyll-build-de']);