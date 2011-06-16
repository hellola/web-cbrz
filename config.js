var config =  {};

init = function(app) {
    app.set('tempdir','/Users/jameelhaffejee/dev/web-cbrz/temp');
    app.set('defaulttempdir','/Users/jameelhaffejee/dev/web-cbrz/tempother');
}
config.init = init;
module.exports = config;
