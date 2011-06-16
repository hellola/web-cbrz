var config =  {};

init = function(app) {
    app.set('tempdir','/home/ewoudt/Documents/Development/web-cbrz/temp/');
    app.set('comicdir','/media/Evo2/Comics/');
}
config.init = init;
module.exports = config;
