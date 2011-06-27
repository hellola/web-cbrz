/**
 * Module dependencies.
 */

var express = require('express');
var webcbr = require('./webcbr');
var config = require('./config');
var path = require('path');
var io = require('socket.io'); 

var app = module.exports = express.createServer();
// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  //app.use(express.cookieParser());
  //app.use(express.session({secret:'comicsrule', store: new mongo_store() }));
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


app.get('/getFiles/:comicBookName', function(req, res){
    console.log('getcomicbookfiles: ' + req.params.comicBookName);
    webcbr.getComicBookFiles(req.params.comicBookName,app,function(files) {
    console.log('reading files list: ' + files.length + ' files: ' + files);
    res.contentType('application/json'); 
    res.send(JSON.stringify(files))
  });
});


app.get('/viewImage/:comicBookHash/:index', function(req, res){
    //get comic name without path
    //var p = req.params.comicBookName.replace(/_/g,'/').split('/');
    //var cname = p[p.length-1];
    webcbr.getComicBookFilePath(app, req.params.comicBookHash, req.params.index, function (filePath) {
    res.sendfile(filePath);
    });
});


app.get(/\/list\/(.*$)/, function(req, res){
  res.render('list', {
    title: 'web cbr and cbz reader',
    locals:{ list: webcbr.list(req.params[0],app)}
  });
});

app.get(/\/read\/(.*$)/, function(req, res){
  webcbr.readFirstFileName(req.params[0],app,function(ff,comicName,comicHash) {
      console.log('reading first returned filename: ' + ff + ' hash: ' + comicHash + ', Name:' + comicName);
      res.render('read', {
        title: 'Reading: ' +  comicName,
        locals:{ firstFile:ff,currentBook: encodeURIComponent(comicHash)}
      });
  });
});

app.get(/\/getNextFile\/([^\/]*)\/([^\/]*$)/, function(req, res){
  webcbr.navigateTo(req.params[0],req.params[1].replace('\n',''),1,app,function(ff) {
  res.partial('ajaxResponse', {
    locals:{ fileName:ff }
  });
 });
});


app.get(/\/getPrevFile\/([^\/]*)\/([^\/]*)/, function(req, res){
  webcbr.navigateTo(req.params[0],req.params[1].replace('\n',''),-1,app,function(ff) {
  res.partial('ajaxResponse', {
    locals:{ fileName:ff }
  });
 });
});

app.get('/navigateTo/:comicBookName/:currentFile/:direction',function(req,res) {
  webcbr.navigateTo(req.params.comicBookName,req.params.currentFile.replace('\n',''),req.params.direction,app,function(ff) {
  res.partial('ajaxResponse', {
    locals:{ fileName:ff }
  });
 });
})



app.get('/navigateToFile/:comicBookName/:currentFile',function(req,res) {
  webcbr.navigateTo(req.params.comicBookName,req.params.currentFile.replace('\n',''),0,app,function(ff) {
  res.partial('ajaxResponse', {
    locals:{ fileName:ff }
  });
 });
})



app.listen(3000,'0.0.0.0');
console.log("Express server listening on port %d",app.address().port);

var socketServer = io.listen(app); 
webcbr.sockerServer= socketServer;
