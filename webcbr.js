var fs = require('fs');
var util = require('util'),
    exec = require('child_process').exec,
    child;
var webcbr = {}

var extractCbz = function(filepath, tempdirpath) {
    var cmd = '';
    if (/.cbr$/.test(filepath))
    {
        cmd = 'unrar x "'+filepath + '" -d "'+ tempdirpath + '"';
    }
    else
    {
        cmd = 'unzip'+' "'+filepath + '" -d "'+ tempdirpath + '"';
    }
    console.log(cmd);
    child = exec(cmd,
        function(error,stdout,stderr) {
            console.log('stdout: '+ stdout);
            console.log('stderr: ' + stderr);
            if (error !== null){
                console.log('exec error: ' + error);
            }
        });
}

var openfile = function(path,res,app) {
    var npath = path.replace(/_/g,'/');
    var tempdir;//todo config value
    if (tempdir == null){
        tempdir = app.settings.tempdir;
        console.log(tempdir);
    }
    var stat = fs.lstatSync(npath);
    if (stat.isDirectory()) {
        //error
    }
    else if (stat.isFile(npath))
    {
       extractCbz(npath,tempdir); 
    }
    return path;
}


var read = function(fileindex, app) {
    //get a list of files in the current dir
    var html = '<a class="prev" href="/viewImage/Amazing Spider-Man 546-.jpg" imageIndex="000">PrevImage</a><a class="next" href="/viewImage/Amazing Spider-Man 546-.jpg" imageIndex="000">Next Image</a><div class="placeholder"></div>';
    return html; 
}

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
            if (stat.isFile()) { l = "/openfile/" } 
            var nfile = '<li class="file"><a href="'+l+encodeURIComponent((path+'/'+ fils[file]).replace(/\//g,'_')) + '">'+fils[file]+'</a></li>';
           newfiles.push(nfile);
        }
        files = newfiles;
	    return '<ul>'+files+'</ul>';
};
webcbr.list = list;
webcbr.openfile = openfile;
webcbr.extractCbz = extractCbz;
webcbr.read = read;
module.exports = webcbr;

