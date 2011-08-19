var config =  {};

config.tempdir = '';
config.comicdir = '';
config.thumbdir = '';
config.mongoserver = 'mongodb://localhost/comics';
config.mongosecret = 'kasjdflksdflksafjlkasdjflksdjflak';
///Users/jameelhaffejee/dev/node/web-cbrz/temp/
///Users/jameelhaffejee/dev/node/web-cbrz/tempother/
///Users/jameelhaffejee/dev/node/web-cbrz/public/thumbs/
init = function(app,callback) {
    var dbController = require('./webcbr_models');
    dbController.appSettingsModel.findOne({},function(error,settingsModel){
           if(error){
               throw error; 
           };
           if(settingsModel){ 
               config.tempdir = settingsModel.tempPath;  
               config.comicdir = settingsModel.comicPath;   
               config.thumbdir = settingsModel.thumbPath;  
               if (app != null){
                   app.set('tempdir',config.tempdir);
                   app.set('comicdir',config.comicdir);
               };
           };
           callback(); 
    });
}

config.init = init;
module.exports = config;
