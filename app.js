/**
 * Module dependencies.
 */

var express = require('express');
var webcbr = require('./webcbr');
var config = require('./config');

var app = module.exports = express.createServer();
// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

config.init(app);

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'web cbr and cbz reader'
  });
});

app.get('/openfile/:path', function(req, res){
  res.render('list', {
    title: 'web cbr and cbz reader',
    locals:{ list: webcbr.openfile(req.params.path,res,app)}
  });
});

app.get('/viewImage/:image', function(req, res){
        console.log(app.settings.tempdir+'/'+req.params.image);
        res.sendfile(app.settings.tempdir+'/'+req.params.image);
});


app.get(/\/list\/(.*$)/, function(req, res){
  res.render('list', {
    title: 'web cbr and cbz reader',
    locals:{ list: webcbr.list(req.params[0],app)}
  });
});


app.get('/read/', function(req, res){
  res.render('read', {
    title: 'web cbr and cbz reader',
    locals:{ list: webcbr.read(req.params[0],app)}
  });
});


app.listen(3000,'0.0.0.0');
console.log("Express server listening on port %d",app.address().port);
