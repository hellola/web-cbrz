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
    child = exec(cmd,
        function(error,stdout,stderr) {
            if (error !== null){
                console.log('exec error: ' + error);
            }
            if(stdout){
               fs.readdir(folder,function(err,files){
                   webcbr.socket.broadcast({'extraction': 'complete','firstFile':files[0],'comicName':pathFixer.basename(folder).replace('/','')});
                   comicbook.files =  new model.files_model();
                   comicbook.files.push({'filename':pathFixer.basename(folder).replace('/',''),'files':files});
               });
            };
        });
};
var openfile = function(path,res,app) {
    var npath = path.replace(/_/g,'/');
    var tempFolder = npath.split('/');
    var fileFolder = tempFolder[tempFolder.length - 1];
    var fileFolderComplete = app.settings.tempdir + fileFolder + '/';
    //this folder doesn't exist yet
    //var stat = fs.lstatSync(fileFolderComplete);
    //if(stat.isDirectory()){
    //    var files = fs.readdirSync(fileFolderComplete);
    //    console.log(files);
    //    return files;
    //}else{
        var tempdir = app.settings.tempdir;
        var stat = fs.lstatSync(npath);
        //surely if its not a dir it has to be a file
        if (stat.isDirectory()) {
            //error
        }
        else if (stat.isFile(npath))
        {
           //extractCbz(npath,tempdir); 
        }
        return path;
    //}
}


var readFirstFileName = function(comicBookName, app,session) {
    //first check if it exists
    var comicbook = model.comicbook_model.findOne({'name': comicBookName});

    if (comicbook == null)
    {
        console.log('comic book is null/ not found');
        //make  a new one
        comicbook = new model.comicbook_model();
        comicbook.name = comicBookName;
        comicbook.save();
    }
    console.log(comicbook.name);
   if(comicbook.files == null || comicbook.files.length == 0){
       comicbook = reloadCache(comicBookName,app,comicbook);
   };
    console.log(comicbook.name);
   if (comicbook.files != null) { 
    for(var i=0;i<comicbook.files.length;i++){
        if(comicbook.files[i].filename == comicBookName){
             return  comicbook.files[i].files[0];
        } 
    }
   }

    console.log(comicbook.name);
    var files = {};
    var comicNameOnly = comicBookName;
    try {
        files = fs.readdirSync(app.settings.tempdir + comicNameOnly +'/'); 
    } catch (e) {
        var nComicBookName = comicBookName;
        extractCbz(pathFixer.join(app.settings.comicdir,comicBookName,comicbook),app.settings.tempdir);
        return '';
        //return 'Exctracted comic book: ' + comicBookName + ' to ' + app.settings.tempdir;
    }
    console.log(comicbook.name);
    for (var i=0;i++;i<files.length) {
        comicbook.files.push({'filename':files[i]});
    }
    comicbook.save(function (err) {});
    return files[0]; 
}

var reloadCache = function(comicBookName,app,comicbook){
    try{
        files = fs.readdirSync(pathFixer.join(app.settings.tempdir,comicBookName+'/')); 
        console.log('files: ' + files.length);
        if (comicbook.files == null) {
            comicbook.files =  new model.files_model();
        }
        comicbook.files.push({'filename':comicBookName,'files':files});
        comicbook.save();
    }catch(e){
        console.log('failed to load ' +  pathFixer.join(app.settings.tempdir,comicBookName+'/'));
    }
    return comicbook;
};

var getNextFile = function(comicBookName,currentFileName, app) {
    var comicbook = model.comicbook_model.findOne({'name': comicBookName});

    if(comicbook.files.length == 0){
        comicbook = reloadCache(comicBookName,app,comicbook);
    };
    for(var i=0;i<comicbook.files.length;i++){
        if(comicbook.files[i].filename == comicBookName){
             var searchIndex = comicbook.files[i].files.indexOf(currentFileName.replace('\n',''));
             return  comicbook.files[i].files[searchIndex +1];
        } 
    }
    return '';
};



var getPrevFile = function(comicBookName,currentFileName, app) {
    var comicbook = model.comicbook_model.findOne({'name': comicBookName});

    if(comicbook.files.length == 0){
        comicbook= reloadCache(comicBookName,app,comicbook);
    };
    for(var i=0;i<comicbook.files.length;i++){
        if(comicbook.files[i].filename == comicBookName){
             var searchIndex = comicbook.files[i].files.indexOf(currentFileName.replace('\n',''));
             return  comicbook.files[i].files[searchIndex -1];
        } 
    }
    return '';
};


var list = function(path,app) {
    if (path == '') { path = app.settings.comicdir}
    
    path = path.replace(/_/g,'/');
    fils = fs.readdirSync(path); 
        var files = fils.filter(function(v) { return /(\.(cbr|cbz)$)|(^[^\.]*$)/.test(v);});
        var newfiles = new Array();
        for (file in fils) {
            var stat = fs.lstatSync(pathFixer.join(path +'/'+ fils[file]));
            console.log('listing: ' + pathFixer.join(path + '/' + fils[file]));
            var l = "";
            if (stat.isDirectory()) { l = "/list/" } 
            if (stat.isFile()) { l = "/read/" } 
            var nfile = '<li class="file"><a href="/read/'+fils[file]+'">'+fils[file]+'</a></li>';
            //var nfile = '<li class="file"><a href="'+l+encodeURIComponent((fils[file]).replace(/\//g,'_')) + '">'+fils[file]+'</a></li>';
           newfiles.push(nfile);
        }
        files = newfiles;
	    return '<ul>'+files+'</ul>';
};
webcbr.list = list;
webcbr.openfile = openfile;
webcbr.extractCbz = extractCbz;
webcbr.readFirstFileName = readFirstFileName;
webcbr.getNextFile  = getNextFile;
webcbr.getPrevFile = getPrevFile;
module.exports = webcbr;
