var fs = require('fs');
var pathFixer = require('path');
var util = require('util'),
    exec = require('child_process').exec,
    child;
var model = require('./webcbr_models');
var webcbr = {};
webcbr.currentSocket = {};

var extractCbz = function(filepath, tempdirpath,comicbook) {
    var cmd = '';
    var fileParts = filepath.split('/');
    console.log('extracting: ' + filepath + ', tempdir:'+tempdirpath + ', ' + comicbook);
    if (/\.cbr$/.test(filepath)){
        var extractionFolder = tempdirpath+'/'+fileParts[fileParts.length -1]+'/'; 
        fs.lstat(extractionFolder,function(error,stat){
               if(error){
                   fs.mkdir(extractionFolder,0777,function(){
                            cmd = 'unrar x "'+filepath + '" -d "'+ extractionFolder + '"';
                            performExtraction(cmd,extractionFolder,comicbook);
                       });       
               }else{
                    cmd = 'unrar x "'+filepath + '" -d "'+ extractionFolder + '"';
                    performExtraction(cmd,extractionFolder,comicbook);
               } 
        });
    }
    else {
        cmd = 'unzip'+' "'+filepath + '" -d "'+ tempdirpath + '"';
        performExtraction(cmd,extractionFolder,comicbook);
    }
};

var performExtraction = function(cmd,folder,comicbook){
    console.log('perform extraction: folder: ' + folder);
    if (comicbook) {
    child = exec(cmd,
        function(error,stdout,stderr) {
            if (error !== null){
                console.log('exec error: ' + error);
            }
            if(stdout){
                console.log('exec finished');
               fs.readdir(folder,function(err,files){
                   console.log('length: ' + files.length);
                   webcbr.socket.broadcast({'extraction': 'complete','firstFile':files[0],'comicName':pathFixer.basename(folder).replace('/','')});

                    for (var i=0;i++;i<files.length) {
                        console.log('adding file to db');
                        file =  new model.files_model();
                        file.filename = files[i];
                        file.read =0;
                        comicbook.files.push(file);
                    }
                    comicbook.save();
               });
            };
        });
    }
    else {
        console.log('comicbook to extract not found ');
    }
};


var getComicBookFiles = function(comicBookName, app, callback) {
    comicBookName = decodeURIComponent(comicBookName);
    model.comicbook_model.findOne({'name': comicBookName}, function(err,comicbook) {
        if (comicbook) {
            var files = comicbook.files;
            if (callback) {
                callback(files);
            }
        }
        else { console.log('comic book not found '); }
    });
};


var readFirstFileName = function(comicBookPath, app,callback) {
    var ff = '';
    comicBookPath= decodeURIComponent(comicBookPath);
    var paths = comicBookPath.split('/');
    var comicBookName = paths[paths.length-1];
    console.log('book name: ' + comicBookName + ', path:' + comicBookPath); //first check if it exists 
    model.comicbook_model.findOne({'name': comicBookName}, function(err,comicbook) { 
        if (comicbook == null) { console.log('comic book is null/ not found'); //make  a new one
        comicbook = new model.comicbook_model();
        comicbook.name = comicBookName;
        comicbook.save();
    }
   if(comicbook.files == null || comicbook.files.length == 0){
       comicbook = reloadCache(comicBookPath,app,comicbook);
   };
   if (comicbook.files != null && comicbook.name == comicBookName && comicbook.files.length != 0) { 
       //console.log(comicbook.name + ' - ' +comicbook.files[0] + ' - ' + comicbook.files[0].filename);
             ff = comicbook.files[0].filename;
             if (callback) { callback(ff,comicBookName); return;}
             console.log("return not breaking execution");
    }
    var files = {};
    var comicNameOnly = comicBookName;
    try {
        console.log('reading comic dir: ' + app.settings.tempdir + comicNameOnly +'/');
        files = fs.readdirSync(app.settings.tempdir + comicNameOnly +'/'); 
    } catch (e) {
        var nComicBookName = comicBookName;
        extractCbz(pathFixer.join(app.settings.comicdir,comicBookPath),app.settings.tempdir,comicbook);
        //return 'Exctracted comic book: ' + comicBookName + ' to ' + app.settings.tempdir;
    }
    comicbook.save(function (err) {});
    ff = files[0]; 
    if (callback) {
        callback(ff,comicBookName);
        extractCbz(pathFixer.join(app.settings.comicdir,comicBookPath),app.settings.tempdir,comicbook);
    }
    else
    {
        console.log('no callback function');
    }
    });
}

var reloadCache = function(comicBookPath,app,comicbook){
    try{
        var paths = comicBookPath.split('/');
        var comicBookName = paths[paths.length-1];
        console.log('reloading cache: ' + pathFixer.join(app.settings.tempdir,comicBookName+'/'));
        var files = fs.readdirSync(pathFixer.join(app.settings.tempdir,comicBookName+'/')); 
        //clear files
        console.log('removing files: ' + comicbook.files.length);
        while (comicbook.files.length > 0) {
            comicbook.files[0].remove();
        }
        console.log('finished removing');

        
        for (var k=0;k<files.length;k++) {
            console.log('adding file: ' + files[k]);
            file =  new model.files_model();
            file.filename = files[k];
            file.read =0;
            comicbook.files.push(file);
            comicbook.save(function(err) { if (err) console.log(err)});
        }
        comicbook.save();
    }catch(e){
        console.log('failed to load ' +  pathFixer.join(app.settings.tempdir,comicBookPath+'/'));
    }
    return comicbook;
};

var navigateTo = function(comicBookName,currentFileName,direction,app,callback) {
    comicBookName = decodeURI(comicBookName);
    currentFileName = decodeURI(currentFileName);
    console.log('navigateTo: ' + comicBookName + ', current: ' + currentFileName);
    var fle ='';
    direction = Number(direction);
    model.comicbook_model.findOne({'name': comicBookName}, function(err,comicbook) {
        if (comicbook) {
            console.log(comicbook.name + ' - ' + comicbook.files.length);
            if(comicbook.files.length == 0){
                comicbook = reloadCache(comicBookName,app,comicbook);
            };
            //var searchIndex = comicbook.files.indexOf(currentFileName.replace('\n',''));
            console.log(currentFileName + ' - direction: '+ direction );
            for(var i=0;i<comicbook.files.length;i++){
                console.log(i + ' - ' + comicbook.files[i].filename);
                 if (currentFileName == comicbook.files[i].filename) {
                     if (comicbook.files[i+direction] != null) {
                         //set to read
                         fle = comicbook.files[i+direction].filename;
                         comicbook.files[i+direction].read = 1;
                         comicbook.save(function(err) { if (err) console.log(err)});
                         console.log('file: ' + fle + ' read: ' + comicbook.files[i+direction].read );
                         break;
                     }
                 }
            }
        }
        else { console.log('comicbook not found '); }
        if (callback) {
            callback(fle);
        }
        else {
            console.log('no callback for getNextFile'); 
        }
        return '';
    });
};




var list = function(path,app) {
    var relpath = "";
    if (path == '') { path = app.settings.comicdir}
    else { relpath = path; path = app.settings.comicdir + path} 
    if (relpath[0] == '/') { relpath = relpath.substr(1,relpath.length -1)}
    if (relpath != '') { relpath = relpath + '/'}
    console.log(relpath);
    path = path.replace(/_/g,'/');
    fils = fs.readdirSync(path); 
    var files = fils.filter(function(v) { return /(\.(cbr|cbz)$)|(^[^\.]*$)/.test(v);});
    var newfiles = new Array();
    newfiles.push('<li class="up" onclick="webcbr.moveUp()"><img src="/images/up.gif" alt=".." widt="32" height="32"/></li>');
    for (file in fils) {
        var fpath = fils[file];
        var stat = fs.lstatSync(pathFixer.join(path +'/'+ fpath));
        console.log('listing: ' + pathFixer.join(path + '/' + fpath));
        var l = "", imgsrc="";
        if (stat.isFile()) {
             l = "/read/" 
             imgsrc="/images/comic.png";
             } 
        if (stat.isDirectory()) {
             l = "/list/" 
             imgsrc="/images/folder.png";
             } 
        console.log('d: ' + stat.isDirectory());
        var filePath =  l + relpath + encodeURIComponent(fpath);
        filePath = filePath.replace(/\/\//,"/");
        var nfile = '<li class="file"><a href="' + filePath+'"><img src="'+imgsrc+'" width="32" height="32" alt=""/><span>'+fpath+'</span></a></li>';
        //var nfile = '<li class="file"><a href="'+l+encodeURIComponent((fils[file]).replace(/\//g,'_')) + '">'+fils[file]+'</a></li>';
       newfiles.push(nfile);
    }
    return '<ul class="files">'+newfiles.join('')+'</ul>';
};

webcbr.list = list;
webcbr.extractCbz = extractCbz;
webcbr.readFirstFileName = readFirstFileName;
webcbr.navigateTo = navigateTo;
webcbr.getComicBookFiles = getComicBookFiles;
module.exports = webcbr;
