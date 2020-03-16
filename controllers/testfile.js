var textract = require('textract');
//var readfile = require('./readdisfile');
//readfile.readFilesHandler('Eclipse IDE.pdf','d:/drive/');
textract.fromFileWithPath('d:/drive/NOC DF.pdf',function(err,text){
  console.log(text);
});
