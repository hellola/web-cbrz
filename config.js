var config =  {};

config.tempdir = '/home/ewoudt/Documents/Development/web-cbrz/temp/';
config.comicdir = '/home/ewoudt/Documents/Development/web-cbrz/tempother/';
config.thumbdir = '/home/ewoudt/Documents/Development/web-cbrz/public/thumbs/';
config.mongoserver = 'mongodb://localhost/comics';
config.mongosecret = 'kasjdflksdflksafjlkasdjflksdjflak';

init = function(app) {
    if (app != null)
    {
        app.set('tempdir',config.tempdir);
        app.set('comicdir',config.comicdir);
    }
    
}

config.init = init;
module.exports = config;
