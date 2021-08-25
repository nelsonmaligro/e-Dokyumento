/*
Controller Module for Monitoring Documents
- handles all operations for monitoring the document routing such as displaying charts and tables, editing,
deleting, and opening while en-route.
- includes password validation when deleting records

@module Monitoring
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
  const monitoring = require('./monitoring');
  const utilsdocms = require('./utilsdocms');
  const dateformat = require('dateformat');
  //initialize url encoding, cookies, and default drive path
  app.use(cookieParser());
  var urlencodedParser = bodyParser.urlencoded({extended:true});
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

    //get show document routing in table monitor
    app.get('/tablemonitor', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getTableMonitor(req, res, id);
      });
    });
    //get document routing in chart monitor
    app.get('/chartmonitor', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getChartMonitor(req, res, id);
      });
    });
    //get document routing in chart monitor without layouts
    app.get('/chartmonitornolayout', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getChartMonitornolayout(req, res, id);
      });
    });
    //get show default monitoring view for dashboard
    app.get('/dashlogs', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getdashlogs(req, res, id);
      });
    });
    //post handle display monitoring in dashboard
    app.post('/dashlogs', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postdashlogs(req, res, id);
      });
    });
    //post handle display document routing in chart monitor
    app.post('/chartmonitor', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postChartMonitor(req, res, id);
      });
    });
    //post handle delete file from monitoring
    app.post('/delmonitor', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        delMonitor(req, res, id);
      });
    });
    //post edit title from table monitoring
    app.post('/editmonitor', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        editMonitor(req, res, id);
      });
    });
    //get open document in the chart and table monitoring
    app.get('/commofile/:file/:branch', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getchartFileopen(req, res);
      });
    });
    //post to validate password prior delete file from monitoring
    app.post('/validatepass', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        dbhandle.validatePassword(req.body.user,req.body.hashval, function (result){
          if (result) {
            console.log('password validated');
            res.json('ok');
          }else {
            res.json('notok');
          }
        });
      });
    });
    //
    //------------------------------------------FUNCTIONS START HERE----------------------------------------------------
    //Process post dashboard logs
    function postdashlogs(req, res, id){
      dbhandle.generateList(arrDB.branch, function (res){ docBr = res; });
      let year = dateformat(Date.now(),'yyyy');
      dbhandle.userFind(id, function(user) {
        //filter dashboard monitoring to specific user level
        if ((user.level.toUpperCase()!='DUTYADMIN') && (user.level.toUpperCase()!='SECRETARY') && (user.level.toUpperCase()!='GM') && (user.level.toUpperCase()!='EAGM') && (user.level.toUpperCase()!='CO') && (user.level.toUpperCase()!='DEP')) {
          docBr = []; docBr.push(user.group.toUpperCase()); // set single branch only if not authorized
        }
        dbhandle.commologsGen(year, docBr, (result)=>{
          dbhandle.genMonitor(async (disMonitor)=>{
            arrBranch = new Array;
            docBr.forEach((branch)=>{
              var count = 0;
              disMonitor.forEach((item)=>{
                let disBranch = item.route[item.route.length-1].branch;
                if ((disBranch[disBranch.length-1]).toUpperCase()=="ALL BRANCHES") {
                  if ((disBranch[0]).toUpperCase()==branch.toUpperCase()) ++count;
                } else if ((disBranch[disBranch.length-1]).toUpperCase()==branch.toUpperCase()) ++count;
              });
              arrBranch.push({branch:branch,count:count});
            });
            await res.json(JSON.stringify({commologs:result, current:arrBranch}));
          });
        });
      });
      console.log('Post logs dashboard');
    }
    //process get logs dashboard
    function getdashlogs(req, res, id){
      dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
      dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
      dbhandle.userFind(id, function(user){
        console.log('GET logs dashboard');
        fs.readdir(drivetmp + user.group, function(err,items){
          let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
          if (err) console.log(err);
          //show explorer if not authorized
          if ((user.level.toUpperCase()!='SYSADMIN') && (user.level.toUpperCase()!='DUTYADMIN') && (user.level.toUpperCase()!='SECRETARY') && (user.level.toUpperCase()!='GM') && (user.level.toUpperCase()!='EAGM') && (user.level.toUpperCase()!='CO') && (user.level.toUpperCase()!='DEP')) {
            dbhandle.groupFind(user.group, function (groups){
              fs.readdir(drivetmp + user.group, function(err,items){
                let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
                if (err) console.log(err);var def="empty";
                var disDrive = '/drive/';rout= "";ref = [];enc = []; disComm = [];
                if (sortArr.length > 0) {def=sortArr[0];}
                return res.render('explorer', {layout:'layout-browse', realdrive:drive, level:user.level, mailfiles:user.mailfiles, docPers:groups, path:disDrive +'No Pending Files.pdf', files:sortArr, disp:"Empty File", branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc, disComm:disComm });
              });
            });
          } else return res.render('commologs', {layout:'layout-user', realdrive:drive, level:user.level, docPers:[], branch:user.group, files:sortArr, disp:"Empty File", mailfiles:user.mailfiles, docBr:docBr, docClass:docClass, docTag:docTag});
        });
      });
    }
    //process get Chart Open
    function getchartFileopen(req, res){
      console.log('GET chart file open');
      var disDrive = '/drive/';var disFile = req.params.file;
      dbhandle.monitorFindTitle(req.params.file, (result)=>{
        disBranch = req.params.branch;
        if (disBranch=='none') disBranch = result.route[result.route.length-1].branch;
        if (fs.existsSync(drivetmp + disBranch +'/'+disFile)){
          if ((dochandle.getExtension(disFile)!='.pdf') && (disFile!='empty')){
            dochandle.convDoctoPDF(drivetmp + disBranch +'/'+disFile,drivetmp + 'PDF-temp/'+disFile +'.pdf', function(){
              return res.render('commofile', {layout:'commofile', path:disDrive + 'PDF-temp/'+ disFile +'.pdf'});
            });
          } else return res.render('commofile', {layout:'commofile',  path:disDrive + disBranch +'/'+ disFile});
        } else return res.render('commofile', {layout:'commofile',  path:disDrive +'No Pending Files.pdf'});
      });
    }
    //process deleting file from monitoring
    function editMonitor(req, res, id){
      dbhandle.monitorFindTitle(req.body.filename, function(result){
        if (result){
          dbhandle.monitorUpdateTitle(req.body.title, req.body.filename);
          dbhandle.actlogsCreate(id, Date.now(), 'Update Commo Title from Monitoring', req.body.filename, req.ip);
          res.json('successful');
        }else{
          res.json('not found');
        }
      });
      console.log('Post Edit Monitor');
    }
    //process deleting file from monitoring
    function delMonitor(req, res, id){
      dbhandle.validatePassword(id,req.body.hashval, function (found){
        if (found) {
          dbhandle.userFind(id, function(user){
            monitoring.getOriginator(req.body.filename, function(branch){
              if ((user.group.toUpperCase()==branch.toUpperCase()) || (user.level.toUpperCase()=='SYSADMIN') || ((branch.toUpperCase()=="ALL BRANCHES") && ((user.level.toUpperCase()=='DUTYADMIN') || (user.level.toUpperCase()=='SECRETARY')))) {
                dbhandle.monitorFindTitle(req.body.filename, function(result){
                  if (result){
                    dbhandle.monitorDel(result.filename, function(){
                      res.json('successful');
                      dbhandle.actlogsCreate(id, Date.now(), 'Delete Commo/File from Monitoring', req.body.filename, req.ip);
                    });
                  } else res.json('fail');
                });
              } else res.json('fail');
            });
          });
        } else res.json('fail');
      });
      console.log('Post Delete Monitor');
    }
    //Process post chart Monitoring function
    function postChartMonitor(req, res, id){
      dbhandle.userFind(id, function(user) {
        let arrRes = [];
        dbhandle.genMonitor(function(result){
          result.reverse();
          result.forEach((item, i) => {
            //filter chart monitor to specific user level
            if ((user.level.toUpperCase()!='SYSADMIN') && (user.level.toUpperCase()!='DUTYADMIN') && (user.level.toUpperCase()!='SECRETARY') && (user.level.toUpperCase()!='GM') && (user.level.toUpperCase()!='EAGM') && (user.level.toUpperCase()!='CO') && (user.level.toUpperCase()!='DEP')) {
              if (item.route[0].branch[0].toUpperCase()==user.group.toUpperCase()) {
                arrRes.push(item); //add to array for this branch only
              }
            } else arrRes.push(item);
          });
          res.json(JSON.stringify(arrRes));
        });
      });
      console.log('Post Query Chart Monitor');
    }
    //Process get file open function
    function getChartMonitor(req, res, id){
      //refresh lists
      dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
      dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
      dbhandle.userFind(id, function(user){
        dbhandle.groupFind(user.group, function (groups){
          fs.readdir(drivetmp + user.group, function(err,items){
            let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
            if (err) console.log(err);var def="empty";
            var disDrive = '/drive/';rout= "";ref = [];enc = [];
            if (sortArr.length > 0) {def=sortArr[0];}
            //res.render('openfile', {layout:'layout-user', path:disDrive +'No Pending Files.pdf', files:items, disp:"Empty File", branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc});
            res.render('chartmonitor', {layout:'layout-user', realdrive:drive, level:user.level, mailfiles:user.mailfiles, docPers:groups, openpath:user.path, path:disDrive +'No Pending Files.pdf', files:sortArr, disp:"Empty File", branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc});
          });
        });
      });
    }
    //Process get file open function
    function getChartMonitornolayout(req, res, id){
      //refresh lists
      dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
      dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
      dbhandle.userFind(id, function(user){
        dbhandle.groupFind(user.group, function (groups){
          fs.readdir(drivetmp + user.group, function(err,items){
            let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
            if (err) console.log(err);var def="empty";
            var disDrive = '/drive/';rout= "";ref = [];enc = [];
            if (sortArr.length > 0) {def=sortArr[0];}
            //res.render('openfile', {layout:'layout-user', path:disDrive +'No Pending Files.pdf', files:items, disp:"Empty File", branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc});
            res.render('chartmonitor2', {layout:'chartmonitor2', level:user.level, mailfiles:user.mailfiles, docPers:groups, openpath:user.path, path:disDrive +'No Pending Files.pdf', files:sortArr, disp:"Empty File", branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc});
          });
        });
      });
    }
    //Process get file open functiondocPers:[],
    function getTableMonitor(req, res, id){
      //refresh lists
      dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
      dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
      let arrRes = [];
      dbhandle.userFind(id, function(user){
        dbhandle.groupFind(user.group, function (groups){
          fs.readdir(drivetmp + user.group, function(err,items){
            let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
            if (err) console.log(err);var def="empty";
            var disDrive = '/drive/';rout= "";ref = [];enc = [];
            if (sortArr.length > 0) {def=sortArr[0];}
            dbhandle.genMonitor(function(result){
              result.reverse();
              result.forEach((item, i) => {
                //filter chart monitor to specific user level
                if ((user.level.toUpperCase()!='SYSADMIN') && (user.level.toUpperCase()!='DUTYADMIN') && (user.level.toUpperCase()!='SECRETARY') && (user.level.toUpperCase()!='GM') && (user.level.toUpperCase()!='EAGM') && (user.level.toUpperCase()!='CO') && (user.level.toUpperCase()!='DEP')) {
                  if (item.route[0].branch[0].toUpperCase()==user.group.toUpperCase()) {
                    arrRes.push(item); //add to array for this branch only
                  }
                } else arrRes.push(item);
              });
              res.render('tablemonitor', {layout:'layout-user', realdrive:drive, level:user.level, mailfiles:user.mailfiles, docPers:groups, monitor:JSON.stringify(arrRes),path:disDrive +'No Pending Files.pdf', files:sortArr, disp:"Empty File", branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc});
            });
          });
        });
      });
    }

  });
};
