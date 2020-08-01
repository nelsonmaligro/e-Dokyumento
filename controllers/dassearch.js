module.exports = function(app, arrDB){
  var fs = require('fs');
  var path = require('path');
  const cookieParser = require('cookie-parser');
  var bodyParser = require('body-parser');
  const dbhandle = require('./dbhandle');
  const dochandle = require('./dochandle');
  const utilsdocms = require('./utilsdocms');
  const dateformat = require('dateformat');
  //var flexsearch = require("flexsearch");
  //var storage = require('dom-storage');

  app.use(cookieParser());
  var urlencodedParser = bodyParser.urlencoded({extended:true});
  var allSearches = new Array;
  var drivetmp = "public/drive/", drive = "D:/Drive/";
  dbhandle.settingDis((setting)=>{drivetmp = setting.publicdrive;});

  //list all document classification and tags
  var docClass = []; var docTag = []; var docBr = [];    var grpUsrs = [];
  dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
  dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
  dbhandle.generateList(arrDB.branch, function (res){ docBr = res; });

  dbhandle.settingDis((setting)=>{
    drive = setting.maindrive;
    //get chart monitor
    app.get('/searchbasic', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getsearchbasic(req, res, id);
      });
    });
    //post upload file
    app.post('/searchbasic', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postsearchbasic(req, res, id);
      });
    });
    //post upload file
    app.post('/searchnext', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postsearchnext(req, res, id);
      });
    });
    ///////////////////////////////////FUNCTIONS START HERE///////////////////////////////////////////////
    //Process post search next
    function postsearchnext(req, res, id){
      let arrSearch = new Array; let x = 0;
      console.log('Post Search Next')
      dbhandle.userFind(id, function(user){
        let idx = allSearches.findIndex(srcitems=>srcitems.user===id);
        if (idx!=-1){
          let items = allSearches[idx].search;
          while ((x<10) && (x<=items.length-1)) {
            arrSearch.push({filename:items[x].filename, content:items[x].content});
            ++x;
          }
          if (x==1) x=2;
          items.splice(0,x);
        }
        res.json(JSON.stringify(arrSearch));
      });
    }
    //Process post search
    function postsearchbasic(req, res, id){
      console.log('Post Search Basic')
      dbhandle.userFind(id, function(user){
        let folders = drive.split('/');let disFolder = folders[folders.length - 2];
        let arrSearch = new Array;
        dbhandle.actlogsCreate(id, Date.now(), 'Content Search', req.body.query, req.ip);
        dochandle.findDocFromDir (req.body.query, drive, disFolder, (docResult, bolFrst)=>{
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
              res.json(JSON.stringify(arrSearch));
            } else resolve(docResult);
          }).then((docResult)=>{
              let index = allSearches.findIndex(srcitems=>srcitems.user===id);
              if (index!=-1) allSearches.splice(index,1);
            docResult.forEach((items, idx)=>{
              let first = items.content.toUpperCase().indexOf(req.body.query.toUpperCase());let last = first;
              if ((first - 300) < 0) first = 0;
              else first = first - 300;
              if ((last + 300) > items.content.length-1) last = items.content.length -1;
              else last = last + 300;
                let sidx = allSearches.findIndex(srcitems=>srcitems.user===id);
                if (sidx == -1) allSearches.push({user:id,query:req.body.query,search:[{filename:items.path+items.title, content:items.content.substring(first,last)}]});
                else allSearches[sidx].search.push({filename:items.path+items.title, content:items.content.substring(first,last)});
            });
            //let indx = allSearches.findIndex(srcitems=>srcitems.user===id);
            //console.log(allSearches[indx].search.length);
          }).catch((err)=>{});
        });
      });
    }
    //Process get search
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
  });
};
