var config =  {};

init = function(app) {
    if (app != null)
    {
        app.set('tempdir','/Users/jameelhaffejee/dev/node/web-cbrz/temp/');
        app.set('comicdir','/Users/jameelhaffejee/dev/node/web-cbrz/tempother/');
    }
    
}
config.mongoserver = 'mongodb://localhost/comics';
config.mongosecret = 'kasjdflksdflksafjlkasdjflksdjflak';

config.init = init;
module.exports = config;
