
var task = require('bud');
var reload = require('gulp-livereload');
require('./assets.js');
require('./server.js');


task('jsx', function(t) {
  t.exec('jsx -x jsx src/jsx src/js').then(t.done);
});

task('bundle', task.once('jsx').watch('./src/jsx/**'), function(t) {
  t.onDone(function() {
     reload.changed(process.cwd() + '/public/src/js/app.js');
  });
  t.exec('browserify src/js/app.js -x react -d -o public/build/js/app.js').then(t.done);
});

task('default', task.once('bundle', 'html', 'serve', 'sass'));

/*
task('react', function(t) {
  process.env.NODE_ENV = 'development';
  t.exec('browserify -t envify -r react -o public/build/js/reactt.js').then(t.done);
});
  */