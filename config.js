var config =  {};

config.tempdir = '/Users/jameelhaffejee/dev/node/web-cbrz/temp/';
config.comicdir = '/Users/jameelhaffejee/dev/node/web-cbrz/tempother/';
config.thumbdir = '/Users/jameelhaffejee/dev/node/web-cbrz/public/thumbs/';
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
