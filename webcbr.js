var fs = require('fs');
var util = require('util'),
    exec = require('child_process').exec,
    child;
var webcbr = {};
var filesLoaded = [];

var extractCbz = function(filepath, tempdirpath) {
    var cmd = '';
    var fileParts = filepath.split('/');
    if (/.cbr$/.test(filepath)){
        var extractionFolder = tempdirpath+'/'+fileParts[fileParts.length -1]+'/'; 
        fs.lstat(extractionFolder,function(error,stat){
               if(error){
                   fs.mkdir(extractionFolder,0777,function(){
                            cmd = 'unrar x "'+filepath + '" -d "'+ extractionFolder + '"';
                            performExtraction(cmd,extractionFolder);
                       });       
               }else{
                    cmd = 'unrar x "'+filepath + '" -d "'+ extractionFolder + '"';
                    performExtraction(cmd,extractionFolder);
               } 
        });
    }
    else {
        cmd = 'unzip'+' "'+filepath + '" -d "'+ tempdirpath + '"';
        performExtraction(cmd,extractionFolder);
    }
};

var performExtraction = function(cmd,folder){
    console.log(cmd);
    child = exec(cmd,
        function(error,stdout,stderr) {
            if (error !== null){
                console.log('exec error: ' + error);
            }
            if(stdout){
               fs.readdir(folder,function(err,files){
                   filesLoaded.push({'filename':fileName,'files':files});
               });
            };
        });
};
var openfile = function(path,res,app) {
    var npath = path.replace(/_/g,'/');
    var tempFolder = npath.split('/');
    var fileFolder = tempFolder[tempFolder.length - 1];
    var fileFolderComplete = app.settings.tempdir +'/'+ fileFolder + '/';
    var stat = fs.lstatSync(fileFolderComplete);
    if(stat.isDirectory()){
        var files = fs.readdirSync(fileFolderComplete);
        console.log(files);
        return files;
    }else{
        var tempdir;//todo config value
        if (tempdir == null){
            tempdir = app.settings.tempdir;
        }
        var stat = fs.lstatSync(npath);
        //surely if its not a dir it has to be a file
        if (stat.isDirectory()) {
            //error
        }
        else if (stat.isFile(npath))
        {
           extractCbz(npath,tempdir); 
        }
        return path;
    }
}


var read = function(comicBookName, app) {
    //get a list of files in the current dir
    //var html = '<a class="prev" href="" imageIndex="000">PrevImage</a>',
        //'<a class="next" href="" imageIndex="000">Next Image</a>';
    for(var i=0;i<filesLoaded.length;i++){
        if(filesLoaded[i].filename == comicBookName){
             return  filesLoaded[i].fileName;
        } 
    }

    files = fs.readdirSync(app.settings.tempdir+'/'+comicBookName+'/'); 
    filesLoaded.push({'filename':comicBookName,'files':files});
    return files[0]; 
}

var reloadCache = function(comicBookName,app){
    files = fs.readdirSync(app.settings.tempdir+'/'+comicBookName+'/'); 
    filesLoaded.push({'filename':comicBookName,'files':files});
};

var getNextFile = function(comicBookName,currentFileName, app) {
    if(filesLoaded.length == 0){
        reloadCache(comicBookName,app);
    };
    for(var i=0;i<filesLoaded.length;i++){
        if(filesLoaded[i].filename == comicBookName){
             var searchIndex = filesLoaded[i].files.indexOf(currentFileName.replace('\n',''));
             return  filesLoaded[i].files[searchIndex +1];
        } 
    }
    return '';
};


var list = function(path,app) {
    if (path == '') { path = app.settings.defaulttempdir} //todo:replace with config value
    path = path.replace(/_/g,'/');
    fils = fs.readdirSync(path); 
        var files = fils.filter(function(v) { return /(\.(cbr|cbz)$)|(^[^\.]*$)/.test(v);});
        var newfiles = new Array();
        for (file in fils) {
            var stat = fs.lstatSync(path +'/'+ fils[file]);
            var l = "";
            if (stat.isDirectory()) { l = "/list/" } 
            if (stat.isFile()) { l = "/read/" } 
            //var nfile = '<li class="file"><a href="'+l+encodeURIComponent((path+'/'+ fils[file]).replace(/\//g,'_')) + '">'+fils[file]+'</a></li>';
            var nfile = '<li class="file"><a href="'+l+encodeURIComponent((fils[file]).replace(/\//g,'_')) + '">'+fils[file]+'</a></li>';
           newfiles.push(nfile);
        }
        files = newfiles;
	    return '<ul>'+files+'</ul>';
};
webcbr.list = list;
webcbr.openfile = openfile;
webcbr.extractCbz = extractCbz;
webcbr.read = read;
webcbr.filesLoaded = filesLoaded;
webcbr.getNextFile  = getNextFile;
module.exports = webcbr;
