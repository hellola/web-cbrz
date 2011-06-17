var mongoose = require('mongoose');
var config = require('./config');

var models = {}

var initCon = function() {
    console.log('c: ' + config.mongoserver);
    db = mongoose.connect(config.mongoserver);
    mongoose.connection.on('open', function() {
        console.log('DB Conn Opened');
    });
}();

var Schema = mongoose.Schema;

var Files = new Schema({
    //id : Number,
    filename: String,
    read : Number

});
var comicbook = new Schema({
    name : String,
    files : [Files]
});


var files_base = mongoose.model('Files',Files);
var files_model = mongoose.model('Files');

var comicbook_base = mongoose.model('comicbook',comicbook);
var comicbook_model = mongoose.model('comicbook');


models.files_base = files_base;
models.files_model= files_model;


models.comicbook_base = comicbook_base;
models.comicbook_model= comicbook_model;


module.exports = models;
