/**
 * Module dependencies.
 */

var express = require('express');
var webcbr = require('./webcbr');
var config = require('./config');
var path = require('path');

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
   res.redirect('/list/');
});

app.get('/openfile/:path', function(req, res){
  var files = webcbr.openfile(req.params.path,res,app);
  var tempFolder = req.params.path.split('_');
  var fileFolder = tempFolder[tempFolder.length - 1];
  res.render('fileList', {
    title: 'web cbr and cbz reader',
    locals:{ list: files,
             firstFile : '/read/'+fileFolder }
  });
});

app.get('/viewImage/:comicBookName/:image', function(req, res){
    //get comic name without path
    var p = req.params.comicBookName.replace(/_/g,'/').split('/');
    var cname = p[p.length-1];
    var file =  app.settings.tempdir + cname +'/'+req.params.image.replace('\n','');
    console.log('viewing image: ' + file);
    res.sendfile(file);
});


app.get(/\/list\/(.*$)/, function(req, res){
  res.render('list', {
    title: 'web cbr and cbz reader',
    locals:{ list: webcbr.list(req.params[0],app)}
  });
});


app.get('/read/:comicBookName', function(req, res){
  var ff = webcbr.read(req.params.comicBookName,app)
  res.render('read', {
    title: 'Reading: ' + path.basename(req.params.comicBookName.replace(/_/g,'/'),'.cbr') + ' - ' + ff,
    locals:{ firstFile:ff,currentBook: req.params.comicBookName}
  });
});

app.get('/getNextFile/:comicBookName/:currentFile', function(req, res){
  var ff = webcbr.getNextFile(req.params.comicBookName,req.params.currentFile.replace('\n',''),app);
  res.partial('ajaxResponse', {
    locals:{ fileName:ff }
  });
});


app.get('/getPrevFile/:comicBookName/:currentFile', function(req, res){
  var ff = webcbr.getPrevFile(req.params.comicBookName,req.params.currentFile.replace('\n',''),app);
  res.partial('ajaxResponse', {
    locals:{ fileName:ff }
  });
});

app.listen(3000,'0.0.0.0');
console.log("Express server listening on port %d",app.address().port);
