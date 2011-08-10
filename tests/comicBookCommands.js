var vows = require('vows'),
    assert = require('assert'),
    pathFixer = require('path');

var config = require('../config');
var webcbr = require('../webcbr');
var comicName = 'asm.cbr';

vows.describe('Comic Book Commands').addBatch({
    'When getting first file from a comic': {
        topic:function(){ 
            webcbr.getFirstFileNameFromArchive(pathFixer.join(config.comicdir,comicName),this.callback)
        }, 

        'we get a string': function (error,firstFileName) {
            assert.isString(firstFileName);
        },
        'which contains the number one': function (error,firstFileName) {
            assert.notEqual(firstFileName.indexOf('1'),-1);
        }
    },
    'When getting extracting first file from a comic': {
        topic:function(){ 
            webcbr.extractFirstImageOnly(pathFixer.join(config.comicdir,comicName),config.thumbdir,this.callback)
        }, 

        'we get a string': function (error,firstFileName) {
            assert.isString(firstFileName);
        },
        'which contains the thumbnail dir in its path': function (error,firstFileName) {
            assert.notEqual(firstFileName.indexOf(config.thumbdir),-1);
        }
    },
    'When resizing a image': {
        topic:function(){ 
            var test = this.callback;
            webcbr.extractFirstImageOnly(pathFixer.join(config.comicdir,comicName),config.thumbdir,function(error,fullPath){
                    webcbr.resizeImageToThumbnail(fullPath,test);
            });
        }, 

        'we get a string': function (error,firstFileName) {
            assert.isString(firstFileName);
        },
        'that is 600x456': function (error,firstFileName) {
            assert.notEqual(firstFileName.indexOf('-small.jpg'),-1);
        }
    }
}).export(module); // Export the Suite
