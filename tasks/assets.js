var fs = require('vinyl-fs');
var reload = require('gulp-livereload');
var vtemplate = require('gulp-template');
var vsass = require('gulp-sass');
var neat = require('node-neat');
var task = require('bud');
var path = require('path');
//var jsx = require('react/lib/ReactServerRendering');

task('html', task.watch('./src/index.html'), function() {
  //var Render = require('../src/js/render');
  //var template = jsx.renderComponentToString(Render ( null ));
  fs.src("./src/index.html")
    .pipe(vtemplate({template: '', react: 'build/js/react.js'}))
    .pipe(fs.dest('./public'))
    .pipe(reload());
});
  
task('sass', task.watch('./src/scss/style.scss'), function(t) {
  var fontAwesome = path.join(__dirname,'../node_modules/font-awesome/scss');
  var bootstrap = path.join(__dirname, '../node_modules/bootstrap-sass/assets/stylesheets');
  var bootswatch = path.join(__dirname, '../node_modules/bootswatch-scss');
  var sasspaths = neat.with(fontAwesome, bootstrap, bootswatch);
  fs.src(t.files[0])
      .pipe(vsass({
        includePaths: sasspaths,
        outputStyle: "nested"//"compressed"
      }))
      .on('error', console.log)
      .pipe(fs.dest('./public/build/css'))
      .pipe(reload());
      
});
