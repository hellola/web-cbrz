var fs = require('fs');
var pathFixer = require('path');
var util = require('util'),
    exec = require('child_process').exec,
    child;
var im = require('imagemagick');

var getFirstFileNameFromArchive = function(filepath,callback){
    var cmd = '';
    cmd = 'unrar lb "'+filepath + '"';
        console.log(cmd);
    child = exec(cmd, function(error,stdout,stderr) {
            if (error !== null){
                console.log('exec error: ' + error);
                callback(error);
            }
            if(stdout){
                var files = stdout.split('\n');
                var lastFile = files[files.length -2];
                files.sort();
                if(lastFile.indexOf('.jpg') == -1){
                    callback(null,lastFile+'/'+files[1]);
                }else{
                    callback(null,files[1]);
                }
            };
        });
};

//This need to change to not auto call the get first file name from archive
var extractFirstImageOnly = function(filepath,thumbdir,callback){
    getFirstFileNameFromArchive(filepath,function(error,firstFile){
        var cmd = '';
        cmd = 'unrar e -y -n"'+firstFile+'" "'+filepath+'" -d "'+thumbdir+'"';
        console.log(cmd);
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
