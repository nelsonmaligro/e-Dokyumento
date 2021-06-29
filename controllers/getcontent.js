/*
Helper Modules for Extracting Content of a File

@module getFileContent
@dependencies office-to-pdf, word-extractor, textract
@copyright 2020
@license GPL
*/
const fs = require('fs');
const textract = require('textract');
const scanocr = require('./scanocr');
const wordextractor = require("word-extractor");
var toPdf = require("office-to-pdf")
var extractor = new wordextractor();

//Add Document
exports.getContent = async function getContent(path, disFile, callback){
    //sanitize file content
    var disContent = "";
    switch(getExtension(disFile))
    {
      case '.doc':
            var extracted = extractor.extract(path);
            extracted.then(async function(doc) {
              if (doc===null) {disContent ='No Content. File Corrupted';}
              else {disContent = await doc.getBody().replace(/[\r\n\t]+/gm,' ');}
              callback(disContent);
            }).catch(async function(err){
              disContent= 'No Content. File Corrupted';
              callback(id, disContent);
            });
            break;
      default:
        await textract.fromFileWithPath(path, async function(err,text){
          //if scanned pdf ....OCR this
          disContent = await text;
          if (disContent === null) disContent = "No Content. Corrupted.";
          if ((disContent.length < 1000) && (getExtension(disFile)==='.pdf')){
            scanocr.outtext(path, async function(data){
              disContent = data.replace(/[\r\n\t]+/gm,' ');
              callback(disContent);
            });
          } else {
              callback(disContent);
          }
        });
    }
  };
  //function to get the file extension
  function getExtension(filename) {
      if (filename.length == 0)
          return "";
      var dot = filename.lastIndexOf(".");
      if (dot == -1)
          return "";
      var extension = filename.substr(dot, filename.length);
      return extension;
  };
