/*
Main App for File and Folder Watch.
     Files and folders are watched so that when a file is added, deleted, and changed, the index file is automatically
     updated.

@module Main App for watching files and automatically index
@author Nelson Maligro
@copyright 2020
@license GPL
*/

const chokidar = require('chokidar');
const fs = require('fs');
const textract = require('textract');
const dochandle = require('./dochandle');
const dbhandle = require('./dbhandle');
const scanocr = require('./scanocr');
const wordextractor = require("word-extractor");
var toPdf = require("office-to-pdf");
var abspath = require('path');
var domain = require('domain');

var drivetmp = "public/drive/", drive = "D:/Drive/";
dbhandle.settingDis((setting)=>{drive = setting.maindrive;});
dbhandle.settingDis((setting)=>{drivetmp = setting.publicdrive;});
var classModel = dbhandle.disModel('class');
var tagModel = dbhandle.disModel('tag');
var brModel = dbhandle.disModel('branch')
var docClass = []; var docTag = []; var docBr = [];
dbhandle.generateList(classModel, function (res){ docClass = res; });
dbhandle.generateList(tagModel, function (res){ docTag = res; });
dbhandle.generateList(brModel, function (res){ docBr = res; });
var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
var express = require('express');
var extractor = new wordextractor();



// Initialize watcher.
const watcher = chokidar.watch('file, dir, glob, or array', {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  ignoreInitial: true,
  usePolling: true,
  interval: 2000,
  awaitWriteFinish: {
    stabilityThreshold: 3000,
    pollInterval: 2000
  },
  persistent: true
});

var d = domain.create();
setTimeout (()=>{

  d.on('error', function(err) {
    fs.appendFileSync('direrr.log',err.message + '\n' + err.stack + '\n');
    throw err;
  });

d.run(function() {

  //var folder = 'n6a';
  //var resPath = drive + folder;
  dbhandle.settingDis((setting)=>{
    drive = setting.maindrive;
    watcher.add(drive);
    // Something to use when events are received.
    const log = console.log.bind(console);
    var arrFileExt=['.pdf','.doc','.docx','.xls','.xlsx','.pptx','.txt'];
    // Add event listeners.
    watcher
      .on('add', function(path){
        if ((!path.includes('~')) && (!path.includes('.idxI')) && (!path.includes('.idxD'))) {
          let folders;
          if (path.includes('/')) folders = path.split('/');
          else if (path.includes('\\')) folders = path.split('\\');
          let disFile = folders[folders.length - 1];let disFolder = folders[folders.length - 2];
          if ((disFolder.toUpperCase()!='INCOMING') && (disFolder.toUpperCase()!='TEXTML') && (disFolder.toUpperCase()!='ROUTING SLIP') && (disFolder.toUpperCase()!='RECOVERHERE') && (disFolder.toUpperCase()!='RECYCLE BIN') && (!disFolder.toUpperCase().includes('RECYCLEBIN'))) {
            let parentFolder = '';
            if ((months.includes(disFolder)) && (folders.length > 3)) parentFolder = folders[folders.length - 4];
            else if (folders.length > 2) parentFolder = folders[folders.length - 3];

            if ((disFile!=disFolder +'.idxD') && (disFile!=disFolder +'.idxI')){ //if not index file
              if ((arrFileExt.includes(getExtension(disFile))) && (disFile.substring(0,1)!='~') && (disFile.substring(0,6).toLowerCase()!='route-')){
                let mainId = generateID();
                  addeditDocu(mainId, path, disFolder, disFile, async function(id, disCont, discurFile){
                    let splitFile = discurFile.split('/');
                    let newdisFile = splitFile[splitFile.length-1];
                  let disFs = await fs.statSync(discurFile);
                  if (disCont.length > 5000) disCont = disCont.substring(0,5000);
                  editMetaDB(id, discurFile, newdisFile, disFs.size, disFs.mtime, disCont, disFolder, parentFolder);
                  //log(`File ${path} has been added`);
                });
              }
            }
          }
        }

      })
      .on('change', function(path){
        if ((!path.includes('~')) && (!path.includes('.idxI')) && (!path.includes('.idxD'))) {
          let folders;
          if (path.includes('/')) folders = path.split('/');
          else if (path.includes('\\')) folders = path.split('\\');
          let disFile = folders[folders.length - 1];let disFolder = folders[folders.length - 2];
          if ((disFolder.toUpperCase()!='INCOMING') && (disFolder.toUpperCase()!='TEXTML') && (disFolder.toUpperCase()!='ROUTING SLIP') && (disFolder.toUpperCase()!='RECOVERHERE') && (disFolder.toUpperCase()!='RECYCLE BIN') && (!disFolder.toUpperCase().includes('RECYCLEBIN'))) {
            let parentFolder = '';
            if ((months.includes(disFolder)) && (folders.length > 3)) parentFolder = folders[folders.length - 4];
            else if (folders.length > 2) parentFolder = folders[folders.length - 3];

            if ((disFile!=disFolder +'.idxD') && (disFile!=disFolder +'.idxI')){ //if not index file
              if ((arrFileExt.includes(getExtension(disFile))) && (disFile.substring(0,1)!='~') && (disFile.substring(0,6).toLowerCase()!='route-')){
                 let mainId = generateID();
                  addeditDocu(mainId, path, disFolder, disFile, function(id, disCont, discurFile){
                    let splitFile = discurFile.split('/');
                    let newdisFile = splitFile[splitFile.length-1];
                    let disFs = fs.statSync(discurFile);
                    if (disCont.length > 5000) disCont = disCont.substring(0,5000);
                    editMetaDB(id, discurFile, newdisFile, disFs.size, disFs.mtime, disCont, disFolder, parentFolder);
                    console.log('Updated :' + newdisFile);
                    //log(`File ${path} has been changed`);
                });
              }
            }
          }

        }
      })
      .on('unlink', function(path){
        if ((!path.includes('~')) && (!path.includes('.idxI')) && (!path.includes('.idxD'))) {
          let folders;
          if (path.includes('/')) folders = path.split('/');
          else if (path.includes('\\')) folders = path.split('\\');
          var disFile = folders[folders.length - 1];var disFolder = folders[folders.length - 2];
          if ((disFile!=disFolder +'.idxD') && (disFile!=disFolder +'.idxI')){ //if not index file
            delDocu(path.substr(0,path.length-disFile.length), disFolder, disFile);
            delMetaDB(path);
            //log(`File ${path} has been deleted`);
          }
        }
      });

    // More possible events.
    watcher
      .on('addDir', path => log(`Directory ${path} has been added`))
      .on('unlinkDir', path => log(`Directory ${path} has been removed`))
      .on('error', error => log(`Watcher error: ${error}`))
      .on('ready', () => log('Initial scan complete. Ready for changes'));
      //.on('raw', (event, path, details) => { // internal
      //log('Raw event info:', event, path, details);
      // });

    //Add metadata to database
    /*
    function addMetaDB(disId, path, disFile, fsSize, fsDeyt, disCont, disFolder, parentFolder){
      dbhandle.generateList(tagModel, function (res){ docTag = res; });
      path = path.replace(/\\/g,'/');
      dbhandle.docFind(path, function (result) {
          if (!result) {
            if (!months.includes(disFolder)){
              if (!docClass.includes(disFolder)){
                if (parentFolder.toUpperCase()=='TAGS'){
                  dbhandle.docCreate(disId, disFile, path, '', "System", [disFolder], fsDeyt, fsSize, disCont,'',[],[],[]);
                  UpdateTag(docTag, disFolder);
                } else dbhandle.docCreate(disId, disFile, path, '', "System", [], fsDeyt, fsSize, disCont,'',[],[],[]);
              } else dbhandle.docCreate(disId, disFile, path, disFolder, "System", [], fsDeyt, fsSize, disCont,'',[],[],[]);
            } else {
                 if (docClass.includes(parentFolder)) dbhandle.docCreate(disId, disFile, path, parentFolder, "System", [], fsDeyt, fsSize, disCont,'',[],[],[]);
                else dbhandle.docCreate(disId, disFile, path, '', "System", [], fsDeyt, fsSize, disCont,'',[],[],[]);
            }
          }
      });

    };
    */
    //Edit metadata from database
    function editMetaDB(disId, path, disFile, fsSize, fsDeyt, disCont, disFolder, parentFolder){
      dbhandle.generateList(tagModel, function (res){ if (res.length > 0) docTag = res; });
      path = path.replace(/\\/g,'/');
      dbhandle.docFindbyId(disId, function (result) {
          if (!result) {
            if (!months.includes(disFolder)){
              if (!docClass.includes(disFolder)){
                if (parentFolder.toUpperCase()=='TAGS'){
                  dbhandle.docCreate(disId, disFile, path, '', "System", [disFolder], fsDeyt, fsSize, disCont,'',[],[],[]);
                  UpdateTag(docTag, disFolder);
                } else dbhandle.docCreate(disId, disFile, path, '', "System", [], fsDeyt, fsSize, disCont,'',[],[],[]);
              } else dbhandle.docCreate(disId, disFile, path, disFolder, "System", [], fsDeyt, fsSize, disCont,'',[],[],[]);
            } else {

                 if (docClass.includes(parentFolder)) dbhandle.docCreate(disId, disFile, path, parentFolder, "System", [], fsDeyt, fsSize, disCont,'',[],[],[]);
                else dbhandle.docCreate(disId, disFile, path, '', "System", [], fsDeyt, fsSize, disCont,'',[],[],[]);
            }
          } else dbhandle.docEditWatch(disId, disFile, path, fsDeyt, fsSize, disCont);
      });

    };
    //delete metadata from database
    async function delMetaDB(path){
      path = path.replace(/\\/g,'/');
      dbhandle.docFind(path, (result)=>{
          if (result) dbhandle.docDel(path,()=>{});
      })
    };
    //Add Document
    async function delDocu(path, disFolder, disFile){
          await dochandle.delDocu(path, disFolder +'.idxD', disFolder +'.idxI', disFile, disFolder);
    };
    //Add Document
    async function addeditDocu(disId, path, disFolder, disFile, callback){
        //sanitize file content
        var disContent = "";
        switch(getExtension(disFile))
        {
          case '.doc':
                var extracted = extractor.extract(path);
                extracted.then(async function(doc) {
                  if (doc===null) {disContent ='No Content. File Corrupted';}
                  else {disContent = await doc.getBody().replace(/[\r\n\t]+/gm,' ');}
                  disDocHandle(disContent, disId, path, disFolder, disFile, function (id, newCont){
                    callback(id, newCont, path);
                  });

                }).catch(async function(err){
                  disContent= 'No Content. File Corrupted';
                  disDocHandle(disContent, disId, path, disFolder, disFile, function (id, newCont){
                    callback(id, newCont, path);
                  });

                });
                break;
          /*case '.ppt':
              var wordBuffer = fs.readFileSync(path);
              toPdf(wordBuffer).then(
                (pdfBuffer) => {
                  fs.writeFileSync(path + '.pdf', pdfBuffer);
                }, (err) => {
                  console.log(err);
                });
            break;*/
          default:
            await textract.fromFileWithPath(path, async function(err,text){
              //if scanned pdf ....OCR this
              disContent = await text;
              if (disContent === null) disContent = "No Content. Corrupted.";
              if ((disContent.length < 1000) && (getExtension(disFile)==='.pdf')){
                scanocr.outtext(path, async function(data){
                  disContent = data.replace(/[\r\n\t]+/gm,' ');
                  disDocHandle(disContent, disId, path, disFolder, disFile, function(id, newCont){
                    callback(id, newCont, path);
                  });

                });
              } else {
                disDocHandle(disContent, disId, path, disFolder, disFile, function(id, newCont){
                  callback(id, newCont, path);
                });

              }
            });
        }
      };

    //Add and Update document into index
    function disDocHandle(disContent, disId, path, disFolder, disFile, callback){
      if (disContent.length > 5000) disContent = disContent.substring(0,5000);
        dochandle.addeditDocu(disId, path.substr(0,path.length-disFile.length), disFolder +'.idxD', disFolder +'.idxI', disContent, disFile, disFolder, async function(id){
          callback(id, disContent);
        });
    };
    //function generate unique numeric // ID
    function generateID(){
      var dateVal = Date.now().toString();
      var randomVal = (Math.floor(Math.random() * Math.floor(9))).toString();
      var id = Math.floor(dateVal+randomVal);
      return id;
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

    //process additional hashtags
    function UpdateTag (docTag, tag){
      if (!docTag.includes(tag)){
        dbhandle.addList(tagModel,tag);
      }
    }
  });


});
},1000);
