var config =  {};

init = function(app) {
    if (app != null)
    {
        app.set('tempdir','/Users/jameelhaffejee/dev/web-cbrz/temp/');
        app.set('comicdir','/Users/jameelhaffejee/dev/web-cbrz/tempother/');
        app.set('webserverURL','http://localhost:3000');
    }
    
}
config.mongoserver = 'mongodb://localhost/comics';

config.init = init;
module.exports = config;
