var config =  {};

init = function(app) {
    if (app != null)
    {
        app.set('tempdir','/home/ewoudt/Documents/Development/web-cbrz/temp/');
        app.set('comicdir','/home/ewoudt/Documents/Development/web-cbrz/tempother/');
    }
    
}
config.mongoserver = 'mongodb://127.0.0.1/db';

config.init = init;
module.exports = config;
