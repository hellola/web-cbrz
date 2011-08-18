var fs = require('fs');
var pathFixer = require('path');
var util = require('util'),
    exec = require('child_process').exec,
    child;
var im = require('imagemagick');

var getFirstFileNameFromArchive = function(filepath,callback){
    var cmd = '';
    cmd = '7z l "'+filepath + '"';
    child = exec(cmd, function(error,stdout,stderr) {
            if (error !== null){
                console.log('exec error: ' + error);
                callback(error);
            }
            if(stdout){
                var files = stdout.split('\n');
                files = files.filter(function(val) {
                    return val.substr(-3) === "jpg";
                });
                for(var i=0;i<files.length;i++){
                     var fileParts = files[i].trim().split(' ');
                     fileParts = fileParts.filter(function(val) {
                         return val !== '';
                     });
                     files[i] = fileParts.splice(5).join(' ');
                }
                var lastFile = files[files.length -2];
                files.sort();
                var returnFile = '';
                for(var i=0;i<files.length;i++){
                     if(files[i].indexOf('1') != -1){
                         returnFile = files[i]; 
                         break;
                     };
                }
                var returnParts = returnFile.split('/'); 
                if(returnParts.length > 1){
                    callback(null,returnParts[1]);
                }else{
                    callback(null,returnParts[0]);
                }
            };
        });
};

//This need to change to not auto call the get first file name from archive
var extractFirstImageOnly = function(filepath,thumbdir,callback){
    getFirstFileNameFromArchive(filepath,function(error,firstFile){
        var cmd = '';
        //'7z e tempother/Red\ Sonja\ v4\ 045\ \(2009\)\ \(oddBot-DCP\).cbz -otemp "Red Sonja v4 045 p001 [2009] (oddBot-DCP).jpg" -r'
        cmd = '7z e "'+filepath+'" -o"'+thumbdir+'" "'+firstFile+'" -r -y';
        child = exec(cmd, function(error,stdout,stderr) {
                if (error !== null){
                    console.log('exec error: ' + error);
                    callback(error);
                }
                if(stdout){
                    var parts = firstFile.split('/');
                    fs.stat(pathFixer.join(thumbdir,parts[parts.length - 1]), function (err, stats) {
                          if (err) throw err;
                          if(stats.isFile()){
                              callback(null,pathFixer.join(thumbdir,parts[parts.length - 1]));
                          }else{
                              callback('file not found'); 
                          }
                    });
                };
        });
    });
};

var resizeImageToThumbnail = function(fullPath,callback){
    var smallImage = fullPath.replace('.jpg','-small.jpg');
    im.resize({ srcPath: fullPath,
                dstPath: smallImage,
                width:   600,
                height:  456 
                }, 
                function(err, stdout, stderr){
                    if (err) throw err
                    callback(null,smallImage);
    });
};

var verifyImageSize = function(fullPath,callback){
    im.identify(['-format', '%wx%h', fullPath], function(err, output){
          if (err) throw err;
          console.log('Shot at '+JSON.stringify(output));
          callback(null,output);
    })
};

var rarManager = {};
rarManager.getFirstFileNameFromArchive = getFirstFileNameFromArchive;
rarManager.extractFirstImageOnly = extractFirstImageOnly;
rarManager.resizeImageToThumbnail = resizeImageToThumbnail;
module.exports = rarManager;
