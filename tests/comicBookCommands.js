var vows = require('vows'),
    assert = require('assert'),
    pathFixer = require('path');

var config = require('../config');
var rarManager = require('../rarManager');
var zipManager = require('../zipManager');
var comicName = 'Brave and the Bold 021 (2009) (Archangel-DCP).cbr';
var comicNameZip = 'Red Sonja v4 045 (2009) (oddBot-DCP).cbz';

vows.describe('Comic Book Commands').addBatch({
    'When getting first file from a comic that is a cbr': {
        topic:function(){ 
            rarManager.getFirstFileNameFromArchive(pathFixer.join(config.comicdir,comicName),this.callback)
        }, 

        'we get a string': function (error,firstFileName) {
            assert.isString(firstFileName);
        },
        'which contains the number one': function (error,firstFileName) {
            assert.notEqual(firstFileName.indexOf('1'),-1);
        }
    },
    'When getting extracting first file from a comic that is a cbr': {
        topic:function(){ 
            rarManager.extractFirstImageOnly(pathFixer.join(config.comicdir,comicName),config.thumbdir,this.callback)
        }, 

        'we get a string': function (error,firstFileName) {
            assert.isString(firstFileName);
        },
        'which contains the thumbnail dir in its path': function (error,firstFileName) {
            assert.notEqual(firstFileName.indexOf(config.thumbdir),-1);
        }
    },
    'When resizing a image that is extracted from a cbr': {
        topic:function(){ 
            var test = this.callback;
            rarManager.extractFirstImageOnly(pathFixer.join(config.comicdir,comicName),config.thumbdir,function(error,fullPath){
                    rarManager.resizeImageToThumbnail(fullPath,test);
            });
        }, 

        'we get a string': function (error,firstFileName) {
            assert.isString(firstFileName);
        },
        'that is 600x456': function (error,firstFileName) {
            assert.notEqual(firstFileName.indexOf('-small.jpg'),-1);
        }
    }
})
.addBatch({
    'When getting first file from a comic that is a cbz': {
        topic:function(){ 
            zipManager.getFirstFileNameFromArchive(pathFixer.join(config.comicdir,comicNameZip),this.callback)
        }, 

        'we get a string': function (error,firstFileName) {
            assert.isString(firstFileName);
        },
        'which contains the number one': function (error,firstFileName) {
            assert.notEqual(firstFileName.indexOf('1'),-1);
        }
    }
    ,'When getting extracting first file from a comic that is a cbz': {
        topic:function(){ 
            zipManager.extractFirstImageOnly(pathFixer.join(config.comicdir,comicNameZip),config.thumbdir,this.callback)
        }, 

        'we get a string': function (error,firstFileName) {
            assert.isString(firstFileName);
        },
        'which contains the thumbnail dir in its path': function (error,firstFileName) {
            assert.notEqual(firstFileName.indexOf(config.thumbdir),-1);
        }
    }
    ,'When resizing a image that is extracted from a cbz': {
        topic:function(){ 
            var test = this.callback;
            zipManager.extractFirstImageOnly(pathFixer.join(config.comicdir,comicNameZip),config.thumbdir,function(error,fullPath){
                    zipManager.resizeImageToThumbnail(fullPath,test);
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
