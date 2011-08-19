var fs = require('fs'),
    config = require("./config"); 
var pathFixer = require('path');
var util = require('util'),
    exec = require('child_process').exec,
    child;
var model = require('./webcbr_models');
var webcbr = {};
var hashlib = require('hashlib');
var archiveManager = require('./rarManager');
webcbr.socketServer = {};

var sort_by = function(field, reverse, primer){
    reverse = (reverse) ? -1 : 1;
    return function(a,b){
        a = a[field];
        b = b[field];
        if (typeof(primer) != 'undefined'){
            a = primer(a);
            b = primer(b);
        }
        if (a<b) return reverse * -1;
        if (a>b) return reverse * 1;
        return 0;
    }
};

var extractCbz = function(filepath, tempdirpath,comicbook,callback) {
    var cmd = '';
    var fileParts = filepath.split('/');
    console.log('extracting: ' + filepath + ', tempdir:'+tempdirpath + ', ' + comicbook);
    if (/\.cbr$/.test(filepath)){
        var extractionFolder = pathFixer.join(tempdirpath,fileParts[fileParts.length -1])+'/'; 
        fs.lstat(extractionFolder,function(error,stat){
               if(error){
                   fs.mkdir(extractionFolder,0777,function(){
                            cmd = 'unrar e "'+filepath + '" -d "'+ extractionFolder + '"';
                            performExtraction(cmd,extractionFolder,comicbook,callback);
                       });       
               }else{
                    cmd = 'unrar e "'+filepath + '" -d "'+ extractionFolder + '"';
                    performExtraction(cmd,extractionFolder,comicbook,callback);
               } 
        });
    }else {
        cmd = 'unzip'+' "'+filepath + '" -d "'+ tempdirpath + '"';
        performExtraction(cmd,extractionFolder,comicbook,callback);
    }
};

//The way we are passing the comic book and folder around in this method is wrong
//and can lead to other weirdness we should technically not do that
var performExtraction = function(cmd,folder,comicbook,callback){
    console.log('perform extraction: folder: ' + folder + ', command: ' + cmd);
    if (comicbook) {
    child = exec(cmd, function(error,stdout,stderr) {
            if (error !== null){
                console.log('exec error: ' + error);
            }
            if(stdout){
                console.log(stdout);
                console.log('exec finished');
                //Removed the file loader from here as the cache loader does a better job at it
                callback();
            };
        });
    }
    else {
        console.log('comicbook to extract not found ');
	callback();
    }
};


var getComicBookFiles = function(comicBookHash, app, callback) {
    comicBookHash= decodeURIComponent(comicBookHash);
    console.log('getting comicbook: ' + comicBookHash);
    model.comicbook_model.findOne({'hash': comicBookHash}, function(err,comicbook) {
        if (comicbook) {
            var files = comicbook.files;
            files.sort(sort_by('filename',false,function(a){ return a.toUpperCase()}));
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
    var comicBookHash= paths[paths.length-1];
    console.log('book hash: ' + comicBookHash + ', path:' + comicBookPath); //first check if it exists 
    model.comicbook_model.findOne({'hash': comicBookHash}, function(err,comicbook) { 
            if (comicbook == null) { console.log('comic book is null/ not found'); //make  a new one
               //it should never be null
               console.log('invalid path');
               return;
            }

            //if there are no files in the db we haven't extracted them yet
            if(comicbook.files == null || comicbook.files.length == 0){
               //replace has in path to comicbookname for extraction
               var realComicBookPath = comicBookPath.replace(comicbook.hash,comicbook.name);
               extractCbz(pathFixer.join(app.settings.comicdir,realComicBookPath),app.settings.tempdir,comicbook,function(){
		       comicbook = reloadCache(app,comicbook);
                       console.log('sending browser notification');
                       webcbr.everyone.now.distribute({'extraction': 'complete','hash':comicbook.hash});//The extraction and cache load is complete we can now load the front end
	       });
            };
            if (comicbook.files != null && comicbook.files.length != 0) { 
                 if (callback) { callback(0,comicbook.name,comicBookHash);
                     return;
                     console.log("return not breaking execution");
                 }
            }
            else{
                console.log('somehow files have not been reloaded');
            }
            var files = {};
            comicbook.save(function (err) {});
            if (callback) {
                callback(0,comicbook.name, comicBookHash);
            }
            else{
                console.log('no callback function');
            }
    });
}

var getComicBookFilePath = function(app, comicBookHash, index, callback) { 
    console.log('trying to find comicbook: ' + comicBookHash);
    model.comicbook_model.findOne({'hash': comicBookHash}, function(err,comicbook) {
        var filepath = "";
        var filename = "";
        if (comicbook) {
            if (comicbook.files.length > 0) {
                comicbook.files.sort(sort_by('filename',false,function(a){ return a.toUpperCase()}));
                if (comicbook.files.length > index) {
                    filename = comicbook.files[index].filename;
                     //mark as read
                     comicbook.files[index].read = 1;
                     comicbook.save(function(err) { if (err) console.log(err)});
                } }
            else {
                console.log('cant find comicbook files, reloading cache');
                comicbook = reloadCache(app, comicbook);
            }
            filepath = pathFixer.join(pathFixer.join(app.settings.tempdir,comicbook.name+'/'),filename);
            if (callback) { 
                console.log('returning file: ' + filepath);
               callback(filepath); 
            }
        }
        else { 
            console.log('comicbook not passed');
        }
    });
};


var reloadCache = function(app,comicbook){
    try{
        if (comicbook) {
            var comicBookName = comicbook.name;
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
                file.read = 0;
                comicbook.files.push(file);
                comicbook.save(function(err) { if (err) console.log(err)});
            }
            //comicbook.save();
        } else { console.log('reload cache wasnt\' sent a comicbook');}
    }catch(e){
        var nm = "";
        if (comicbook) { nm = comicbook.name;}
        console.log('failed to load ' +  pathFixer.join(app.settings.tempdir,nm)+'/');
    }
    return comicbook;
};

var navigateTo = function(comicBookHash,currentFileName,direction,app,callback) {
    comicBookHash = decodeURI(decodeURIComponent(comicBookHash));
    currentFileName = decodeURI(decodeURIComponent(currentFileName));
    console.log('navigateTo: ' + comicBookHash+ ', current: ' + currentFileName);
    var fle ='';
    direction = Number(direction);
    model.comicbook_model.findOne({'hash': comicBookHash}, function(err,comicbook) {
        if (comicbook) {
            console.log(comicbook.name + ' - ' + comicbook.files.length);
            if(comicbook.files.length == 0){
                comicbook = reloadCache(app,comicbook);
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

var createComic = function(comicBookName, forceReload,callback) {
    console.log('creating comic');
    model.comicbook_model.findOne({'name': comicBookName}, function(err,comicbook) {
        if (comicbook) {
            console.log('comic already exists')
            if (forceReload) {
                comicbook.remove();
            }
            else
            {
                console.log('stopping comicbook create');
                callback(comicbook);
                return;
            }
        }
        if (comicbook == null) { 
            console.log('comic book is null/ not found'); 
        }//make  a new one
        var pathToComic = pathFixer.join(config.comicdir,comicBookName)

        archiveManager.extractFirstImageOnly(pathToComic,config.thumbdir,function(error,thumbImage){
            console.log('extracted first image');
            archiveManager.resizeImageToThumbnail(thumbImage,function(err,tinyImage){
                console.log('resized first image');
                comicbook = new model.comicbook_model();
                comicbook.name = comicBookName;
                comicbook.hash = hashlib.md5(comicBookName);
                comicbook.thumbImage = tinyImage;
                comicbook.save(function(err){
                   if(!err){
                        callback(comicbook);
                   } 
                });    
            });
             
        });
    });
};

var listSimple = function(path,app,callback) {
    var relpath = "";
    if (path == '') { 
        path = app.settings.comicdir
    } else { 
        relpath = path; path = app.settings.comicdir + path
    }; 
    if (relpath[0] == '/') { relpath = relpath.substr(1,relpath.length -1)}
    if (relpath != '') { relpath = relpath + '/'}
    path = path.replace(/_/g,'/');
    fils = fs.readdirSync(path); 
    var files = fils.filter(function(v) { return /(\.(cbr|cbz)$)|(^[^\.]*$)/.test(v);});
    var newfiles = new Array();
    var buildData = function(i){
       if(i < fils.length){
           var fpath = fils[i];
           var stat = fs.lstatSync(pathFixer.join(path +'/'+ fpath));
           if (stat.isFile()) {
                createComic(fpath, false ,function(comicbook){
                        var thumb = comicbook.thumbImage;
                        var parts = config.thumbdir.split('/');
                        
                        thumb = thumb.replace(config.thumbdir,parts[parts.length-2] +'/'+parts[parts.length-1].replace('/',''));
                        newfiles.push({'name':fpath,'thumb':thumb,'link':comicbook.hash});
                        buildData(i+1);
                });
           }else{
                newfiles.push({'name':fpath,'thumb':'','link':fpath});
                buildData(i+1);
           }
       }else{
         if (callback) {
            callback(newfiles);
         }
       } 
    };
    buildData(0);
};

webcbr.listSimple = listSimple;
webcbr.extractCbz = extractCbz;
webcbr.readFirstFileName = readFirstFileName;
webcbr.navigateTo = navigateTo;
webcbr.getComicBookFiles = getComicBookFiles;
webcbr.getComicBookFilePath = getComicBookFilePath;
module.exports = webcbr;
