/*
Controller Module for Searching Documents
- handles document searching including basic content search, and metadata search.

@module documentSearch
@author Nelson Maligro
@copyright 2020
@license GPL
*/
module.exports = function(app, arrDB){
  var fs = require('fs');
  var path = require('path');
  const cookieParser = require('cookie-parser');
  var bodyParser = require('body-parser');
  const dbhandle = require('./dbhandle');
  const dochandle = require('./dochandle');
  const utilsdocms = require('./utilsdocms');
  const dateformat = require('dateformat');
  var rateLimit = require('express-rate-limit');

  //initialize url encoding, cookies, and default drive path
  app.use(cookieParser());
  var urlencodedParser = bodyParser.urlencoded({extended:true});
  global.allSearches = new Array;
  var drivetmp = "public/drive/", drive = "D:/Drive/";
  dbhandle.settingDis((setting)=>{drivetmp = setting.publicdrive;});

  //list all document classification and tags
  var docClass = []; var docTag = []; var docBr = [];    var grpUsrs = [];
  dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
  dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
  dbhandle.generateList(arrDB.branch, function (res){ docBr = res; });

  dbhandle.settingDis((setting)=>{
    drive = setting.maindrive;
    //
    //---------------------------------- Express app handling starts here --------------------------------------------------
    //handle post advance search
    app.post('/searchadv', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postsearchadv(req, res, id);
      });
    });
    //handle post advance search show file
    app.post('/searchshow', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postsearchshow(req, res, id);
      });
    });
    //get default view for advance search
    app.get('/searchadv', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getsearchadv(req, res, id);
      });
    });
    //get default view for content search
    app.get('/searchbasic', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getsearchbasic(req, res, id);
      });
    });
    //post handle content searching
    app.post('/searchbasic', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postsearchbasic(req, res, id);
      });
    });
    //post handle next page content searching
    app.post('/searchnext', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postsearchnext(req, res, id);
      });
    });
    //
    //------------------------------------------FUNCTIONS START HERE----------------------------------------------------
    //Process post search next
    function postsearchnext(req, res, id){
      let arrSearch = new Array; let x = 0;
      console.log('Post Search Next')
      dbhandle.userFind(id, function(user){
        let idx = global.allSearches.findIndex(srcitems=>srcitems.user===id);
        if (idx!=-1){
          let items = global.allSearches[idx].search;
          while ((x<10) && (x<=items.length-1)) {
            arrSearch.push({filename:items[x].filename, content:items[x].content});
            ++x;
          }
          if (x==1) x=2;
          items.splice(0,x);
          res.json(JSON.stringify(arrSearch));
        } else res.json('Empty');

      });
    }
    //Process post search
    function postsearchbasic(req, res, id){
      console.log('Post Search Basic')
      dbhandle.userFind(id, function(user){
        let folders = drive.split('/');let disFolder = folders[folders.length - 2];
        let arrSearch = new Array;
        dbhandle.actlogsCreate(id, Date.now(), 'Content Search', req.body.query, req.ip);
        dochandle.findDocFromDir (req.body.query, drive, disFolder, id, (docResult, bolFrst)=>{
          let index = global.allSearches.findIndex(srcitems=>srcitems.user===id);
          if (index!=-1) global.allSearches.splice(index,1);
          //console.log(global.allSearches.length);
          let disPromise = new Promise((resolve, reject)=>{
            if (bolFrst){
              docResult.forEach((items, idx)=>{
                let first = items.content.toUpperCase().indexOf(req.body.query.toUpperCase());let last = first;
                if ((first - 300) < 0) first = 0;
                else first = first - 300;
                if ((last + 300) > items.content.length-1) last = items.content.length -1;
                else last = last + 300;
                arrSearch.push({filename:items.path+items.title, content:items.content.substring(first,last)});
              });
              //console.log(arrSearch);
              res.json(JSON.stringify(arrSearch));
            } //else resolve(docResult);
          }).catch((err)=>{});
        });
      });
    }
    //Process get content search
    function getsearchbasic(req, res, id){
      //refresh lists
      dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
      dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
      dbhandle.userFind(id, function(user){
        dbhandle.groupFind(user.group, function (groups){
          fs.readdir(drivetmp + user.group, function(err,items){
            let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
            console.log('Basic index searching');
            if (err) throw err;var def="empty";
            var disDrive = '/drive/';rout= "";ref = [];enc = [];
            if (sortArr.length > 0) {def=sortArr[0];}
            res.render('searchbasic', {layout:'layout-user', realdrive:drive, level:user.level, mailfiles:user.mailfiles, docPers:groups, openpath:user.path, path:disDrive +'No Pending Files.pdf', files:sortArr, disp:"Empty File", branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc});
          });
        });
      });
    }
    //Process get advance search
    function getsearchadv(req, res, id){
      //refresh lists
      dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
      dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
      dbhandle.userFind(id, function(user){
        dbhandle.groupFind(user.group, function (groups){
          fs.readdir(drivetmp + user.group, function(err,items){
            let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
            console.log('Advance searching');
            if (err) throw err;var def="empty";
            var disDrive = '/drive/';rout= "";ref = [];enc = [];
            if (sortArr.length > 0) {def=sortArr[0];}
            res.render('searchadv', {layout:'layout-user', realdrive:drive, level:user.level, mailfiles:user.mailfiles, docPers:groups, openpath:user.path, path:disDrive +'No Pending Files.pdf', files:sortArr, disp:"Empty File", branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc});
          });
        });
      });
    }
    //Process post search
    function postsearchadv(req, res, id){
      console.log('Post Search Advance')
      dbhandle.userFind(id, function(user){
        switch(req.body.select) {
          case 'class':
            dbhandle.docFindClass(req.body.class, (result) => {
              res.json(JSON.stringify(result));
            });
            break;
          case 'tag':
            dbhandle.docFindTag(req.body.class, (result) => {
              res.json(JSON.stringify(result));
            });
            break;
          case 'author':
            dbhandle.docFindAuthor(req.body.class, (result) => {
              res.json(JSON.stringify(result));
            });
            break;
          case 'filename':
            dochandle.findFilenameFromDir(req.body.class, drive, req.body.select, true, (result) => {
              res.json(JSON.stringify(result));
            });
            break;
          case 'size':
            let grtr = true; if (req.body.grtr == '<') grtr = false; //determine greater than sign
            dochandle.findFilenameFromDir(req.body.class, drive, req.body.select, grtr, (result) => {
              res.json(JSON.stringify(result));
            });
          break;
          case 'datepick':
            dochandle.findFilenameFromDir(req.body.class, drive, req.body.select, req.body.grtr, (result) => {
              res.json(JSON.stringify(result));
            });
          break;
          }
        dbhandle.actlogsCreate(id, Date.now(), 'Advance Search', req.body.query, req.ip);
      });
    }
    //process post explorer show file function
    function postsearchshow(req, res, id){
      console.log('Show File Advance Search');
      var disDrive = '/drive/';
      let newDrive = req.body.path;
      //if (newDrive.toUpperCase().includes('D:/DRIVE')){
      //  let drivePre = newDrive.substring(0,8);
      //  newDrive = newDrive.replace(drivePre,drive.substring(0,drive.length-1));
      //}
      var disFile = req.body.file; var disPath= newDrive;
      dbhandle.docFind(disPath, async function (found){
        //copy file to temp path for preview
        if (fs.existsSync(disPath)){
          if (dochandle.getExtension(disFile)!='.pdf'){
            if (fs.existsSync(drivetmp + 'PDF-temp/'+ disFile +'.pdf')) fs.unlinkSync(drivetmp + 'PDF-temp/'+ disFile +'.pdf');
            dochandle.convDoctoPDF(disPath, drivetmp + 'PDF-temp/'+ disFile +'.pdf', function() { //convert doc to pdf
              let arrBr = [{tempPath: disDrive + 'PDF-temp/'+ disFile +'.pdf'}];
              res.json(JSON.stringify(arrBr)); //return metadata
            });
          } else {
            fs.copyFile(disPath, drivetmp + 'PDF-temp/'+ disFile, function(err) {
              let arrBr = [{tempPath: disDrive + 'PDF-temp/'+ disFile}];
              res.json(JSON.stringify(arrBr)); //return metadata
            });
          }
        }

      });
    }
  });
};
