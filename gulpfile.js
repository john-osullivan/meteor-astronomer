import gulp from 'gulp';
import babel from 'gulp-babel';
import plumber from 'gulp-plumber';
import del from 'del';

// var gulp = require("gulp"),
//     babel = require("gulp-babel"),
//     plumber = require("gulp-plumber"),
//     del = require("del");

const settings = {
  src: 'src/**/*.js',
  dist: 'dist'
};

gulp.task('clean', function() {
    del(settings.dist + "/*");
});

gulp.task('babel', function () {
    return gulp.src(settings.src)
        .pipe(plumber({
            errorHandler: function(err) {
                console.error(err);
                this.emit('end');
            }
        }))
    .pipe(babel())
    .pipe(gulp.dest(settings.dist));
});

gulp.task('build', ['clean', 'babel']);

gulp.task('watch', ['build'], function() {
    gulp.watch(settings.src, ['build']);
});
