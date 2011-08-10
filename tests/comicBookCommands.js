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
        'which contains the word thumbs': function (error,firstFileName) {
            assert.notEqual(firstFileName.indexOf('thumbs'),-1);
        }
    }
}).export(module); // Export the Suite
