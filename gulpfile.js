var gulp = require('gulp');
var zip = require("gulp-zip");

gulp.task("default", function() {
    return gulp.src(["**"])
        .pipe(zip("deploy.zip"))
        .pipe(gulp.dest("../"));
});