
let dbhandle = require('./dbhandle');
dbhandle.getFilesbyDir('D:/drive/n6c', function(res){
  res.forEach((item)=>{
    console.log(item.filename);
  });
});
//var pdflib = require('./pdflib');
//pdflib.editPDF('../public/drive/routeblank.pdf');
/*
var fs = require('fs');
var dateformat = require('dateformat');
var dochandle = require('./dochandle');
dochandle.findDocFromDir ('Philippine', 'D:/Drive/', 'Drive', (docResult, bolFirst)=>{
  if (bolFirst) console.log('First: '+ docResult.length);
  else console.log('Last: ' + docResult.length);
});
*/
//console.log(dateformat(fs.statSync('d:/drive/NOC DF.pdf').cTime,"mmm yyyy"));
/*
var toPdf = require("office-to-pdf");
var fs = require("fs");
disPath = "d:/drive/"
var wordBuffer = fs.readFileSync(disPath + "Network and IS.xlsx");

toPdf(wordBuffer).then(
  (pdfBuffer) => {
    fs.writeFileSync(disPath + "Network and IS.pdf", pdfBuffer);
  }, (err) => {
    console.log(err);
  }
)
*/
/*
//var textract = require('textract');
//const mongoose = require('mongoose');
const dbhandle = require('./dbhandle');
const dateformat = require('dateformat');
//dbhandle.userCreate ('juan', 'cruz', 'mario@gmailcom', 'n6a', 'oicBranch', 'x:/',['z:/Rootcon.docx']);
//const path = require('path');
dbhandle.genUsers(function (arrRes){
  arrRes.forEach (function (item){
    //item.filepath = path.resolve('../public/drive');
    dbhandle.userUpdate (item.userN, item.hashP, item.email, item.salt, item.group, item.level, item.path,['d:/drive/Rootcon.docx','d:/drive/NOC DF.pdf']);
  });
});
*/
/*
var path = "d:/drive/n6b/"
file1 = 'xRootcon.docx';file2 = 'xEclipse Ide.pdf';file3 = 'xNOC DF-The quick brown fox.pdf';
file4 = 'xnotRootcon.docx';file5 = 'xnotEclipse Ide.pdf';file6 = 'xnotNOC DF-The quick brown fox.pdf';
file7 = 'xnewRootcon.xlsx';file8 = 'xnewEclipse Ide.pdf';file9 = 'xnewNOC DF-The quick brown fox.pdf';

deyt1 = dateformat("03 January 2020","dd mmm yyyy");deyt2 = dateformat("10 January 2020","dd mmm yyyy");deyt3 = dateformat("25 January 2020","dd mmm yyyy");
deyt4 = dateformat("03 February 2020","dd mmm yyyy");deyt5 = dateformat("10 February 2020","dd mmm yyyy");deyt6 = dateformat("25 Februar 2020","dd mmm yyyy");
deyt7 = dateformat("03 March 2020","dd mmm yyyy");deyt8 = dateformat("10 March 2020","dd mmm yyyy");deyt9 = dateformat("25 March 2020","dd mmm yyyy");
dbhandle.monitorCreate (file1, file1, deyt1, ['N6A','N6B'], path+file1);
dbhandle.monitorCreate (file2, file2, deyt2, ['N6B'], path+file2);
dbhandle.monitorCreate (file3, file3, deyt3, ['N6C'], path+file3);
dbhandle.monitorCreate (file4, file4, deyt1, ['All Branches'], path+file4);
dbhandle.monitorCreate (file5, file5, deyt2, ['N6D'], path+file5);
dbhandle.monitorCreate (file6, file6, deyt3, ['N6E'], path+file6);
dbhandle.monitorCreate (file7, file7, deyt1, ['N6B','N6C','N6A',], path+file7);
dbhandle.monitorCreate (file8, file8, deyt2, ['N6D'], path+file8);
dbhandle.monitorCreate (file9, file9, deyt3, ['N6E'], path+file9);

//route1 = [{branch:['N6A'], deyt:deyt2},{branch:['N6B'], deyt:deyt4},{branch:['N6C'], deyt:deyt5},{branch:['EXO'], deyt:deyt7}]
//route2 = [{branch:['All Branches'], deyt:deyt4},{branch:['N6D'], deyt:deyt5},{branch:['N6B'], deyt:deyt7},{branch:['EXO'], deyt:deyt8}]
//route3 = [{branch:['N6A','N6B'], deyt:deyt5},{branch:['N6D'], deyt:deyt7},{branch:['N6F'], deyt:deyt8},{branch:['EXO'], deyt:deyt9}]
//route4 = [{branch:['N6B'], deyt:deyt2},{branch:['N6C'], deyt:deyt3},{branch:['N6D'], deyt:deyt5},{branch:['EXO'], deyt:deyt7}]
//route5 = [{branch:['N6A'], deyt:deyt3},{branch:['N6F'], deyt:deyt4},{branch:['N6B'], deyt:deyt7},{branch:['EXO'], deyt:deyt8}]
//route6 = [{branch:['N6B','N6C','N6D'], deyt:deyt4},{branch:['N6B'], deyt:deyt5}]
//route7 = [{branch:['N6C'], deyt:deyt2},{branch:['N6F'], deyt:deyt3},{branch:['EXO'], deyt:deyt5}]
//route8 = [{branch:['N6D'], deyt:deyt3},{branch:['N6B'], deyt:deyt4}]
//route9 = [{branch:['All Branches'], deyt:deyt4},{branch:['N6C'], deyt:deyt5},{branch:['N6A'], deyt:deyt8}]

//dbhandle.monitorAddRoute(file1, file1, route1, path+file1);
//dbhandle.monitorAddRoute(file2, file2, route2, path+file2);
//dbhandle.monitorAddRoute(file3, file3, route3, path+file3);
//dbhandle.monitorAddRoute(file4, file4, route4, path+file4);
//dbhandle.monitorAddRoute(file5, file5, route5, path+file5);
//dbhandle.monitorAddRoute(file6, file6, route6, path+file6);
//dbhandle.monitorAddRoute(file7, file7, route7, path+file7);
//dbhandle.monitorAddRoute(file8, file8, route8, path+file8);
//dbhandle.monitorAddRoute(file9, file9, route9, path+file9);

*/
//var brModel = accs.disModel('tag');
//accs.docEdit(1001, 'Rootcon.docx', 'D:/Projects/PN DocMS/public/drive/n6b/Rootcon.docx', 'SOP', 'Nelson', ['Cyber Lab','Hacker'], Date.now(), 200, "The Quick Brow Fox", 'd:/drive/n6b/Routing Slip/rout.pdf', ['d:/drive/Eclipse IDE.pdf','d:/drive/rootcon.doc'], ['d:/drive/Update.pptx'])
//accs.createList(brModel,'covid 19');
/*
var classModel = accs.disModel('class');
accs.findList(classModel,'SOP', function (res){
  console.log(res);
});

accs.generateList(classModel, function (res){
  console.log(res);
});
*/
//const dbhandle = require('./dbhandle');
/*
dbhandle.genMonitor(async (result)=>{
  //result.forEach((item)=>{
    var x = 0;
    while (x < result.length-1){
    let disBranch = result[x].route[0].branch[0];
    let disMonth = dateformat(result[x].route[0].deyt,'mmm').toUpperCase();
    var disPromise = await new Promise((resolve, reject)=>{
          dbhandle.commologsUpdate (dateformat(Date.now(),'yyyy'), disMonth, disBranch, ()=>{ resolve();});
      }).then(()=>{
        ++x;
      });
    }
  //});
});
*/
//dbhandle.commologsUpdate ('2020', "Apr", 'N6B', 1, ()=>{
//  console.log('ok');
//});
//dbhandle.commologsGen('2020',(result)=>{
//  console.log(result);
//});
//var branch = dbhandle.disModel('branches');
//dbhandle.addList(branch,'N6');
//dbhandle.userCreate('lakay', 'hacker', 'nelsonmaligro@gmail.com', 'N6B', 'SysAdmin','x:/',[]);
//dbhandle.settingCreate('D:/Drive/', 'public/drive/', 'public');
//const userModel = require('../models/accounts');
//var readfile = require('./readdisfile');
//readfile.readFilesHandler('Eclipse IDE.pdf','d:/drive/');
/*
textract.fromFileWithPath('d:/drive/NOC DF.pdf',function(err,text){
  console.log(text);
});
*/
