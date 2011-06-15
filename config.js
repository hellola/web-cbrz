var config =  {};

init = function(app) {
    app.set('tempdir','/home/ewoudt/Documents/Development/web-cbr/temp/');
    app.set('defaulttempdir','/home/ewoudt');
}
config.init = init;
module.exports = config;
