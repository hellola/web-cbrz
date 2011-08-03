var models = require('./webcbr_models');

var clearDB = function(){
    models.comicbook_base.find({},function(err,docs){
           if(!err){
            docs.forEach(function(doc){
               doc.remove(); 
                });
           }; 
    });
    models.comicbook_model.find({},function(err,docs){
           if(!err){
            docs.forEach(function(doc){
               doc.remove(); 
                });
           }; 
    });
};

module.exports.clearDB = clearDB;
