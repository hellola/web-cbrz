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
    if (comicbook) {
    child = exec(cmd,
        function(error,stdout,stderr) {
            if (error !== null){
                console.log('exec error: ' + error);
            }
            if(stdout){
               fs.readdir(folder,function(err,files){
                   webcbr.socket.broadcast({'extraction': 'complete','firstFile':files[0],'comicName':pathFixer.basename(folder).replace('/','')});

                    for (var i=0;i++;i<files.length) {
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
    model.comicbook_model.findOne({'name': comicBookName}, function(err,comicbook) {
        var files = comicbook.files;
        if (callback) {
            callback(files);
        }
    });
};


var readFirstFileName = function(comicBookName, app,callback) {
    var ff = '';
    //first check if it exists
    model.comicbook_model.findOne({'name': comicBookName}, function(err,comicbook) {

    if (comicbook == null)
    {
        console.log('comic book is null/ not found');
        //make  a new one
        comicbook = new model.comicbook_model();
        comicbook.name = comicBookName;
        comicbook.save();
    }
   if(comicbook.files == null || comicbook.files.length == 0){
       comicbook = reloadCache(comicBookName,app,comicbook);
   };
   if (comicbook.files != null && comicbook.name == comicBookName && comicbook.files.length != 0) { 
       //console.log(comicbook.name + ' - ' +comicbook.files[0] + ' - ' + comicbook.files[0].filename);
             ff = comicbook.files[0].filename;
    }
    var files = {};
    var comicNameOnly = comicBookName;
    try {
        files = fs.readdirSync(app.settings.tempdir + comicNameOnly +'/'); 
    } catch (e) {
        var nComicBookName = comicBookName;
        extractCbz(pathFixer.join(app.settings.comicdir,comicBookName,comicbook),app.settings.tempdir);
        //return 'Exctracted comic book: ' + comicBookName + ' to ' + app.settings.tempdir;
    }
    comicbook.save(function (err) {});
    ff = files[0]; 
    if (callback) {
        callback(ff);
    }
    else
    {
        console.log('no callback function');
    }
    });
}

var reloadCache = function(comicBookName,app,comicbook){
    try{
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
        console.log('failed to load ' +  pathFixer.join(app.settings.tempdir,comicBookName+'/'));
    }
    return comicbook;
};

var navigateTo = function(comicBookName,currentFileName,direction,app,callback) {
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
webcbr.extractCbz = extractCbz;
webcbr.readFirstFileName = readFirstFileName;
webcbr.navigateTo = navigateTo;
webcbr.getComicBookFiles = getComicBookFiles;
module.exports = webcbr;
