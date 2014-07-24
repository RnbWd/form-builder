
var task = require('bud');

var morgan = require('morgan');
var bodyParser = require('body-parser');
var path = require('path');
var root = path.resolve('./public/');
var express = require('express');

task('serve', function (t) {
  var app = express();
  var http = require('http').Server(app);
  console.log(root);
  app.use(express.static(root));
  app.use(bodyParser.json());
  app.use(morgan('dev'));

  app.get('/state', function(req, res) {
    console.log(req.body);
    res.send('okay');
  });

  http.listen(3000, function(){
    console.log('listening on localhost:3000');
  });
  
});



