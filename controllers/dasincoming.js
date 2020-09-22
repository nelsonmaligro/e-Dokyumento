/*
Controller Module for Processing Incoming Documents
     - handles operations for all documents inside the incoming folder such as routing, classifying, and Machine Learning.
     - handles client login, logout, and files checking every interval.

@module Incoming
@author Nelson Maligro
@copyright 2020
@license GPL
*/
module.exports = function(app, arrDB) {
  var scanocr = require('./scanocr');
  var routeduty = require('./routeduty');
  var fs = require('fs');
  var path = require('path');
  var bodyParser = require('body-parser');
  const cookieParser = require('cookie-parser');

  const dbhandle = require('./dbhandle');
  const dochandle = require('./dochandle');
  const monitoring = require('./monitoring');
  const pdflib = require('./pdflib');
  const utilsdocms = require('./utilsdocms');
  const dateformat = require('dateformat');
  var promise = require('promise');
  //initialize url encoding, cookies, and default drive path
  app.use(cookieParser());
  var urlencodedParser = bodyParser.urlencoded({extended:true});
  var drivetmp = "public/drive/", drive = "D:/Drive/", publicstr='public';
  dbhandle.settingDis((setting)=>{drivetmp = setting.publicdrive;});
  dbhandle.settingDis((setting)=>{publicstr = setting.publicstr;});

  //list all document classification and tags
  var docClass = []; var docTag = []; var docBr = [];    var grpUsrs = [];
  dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
  dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
  dbhandle.generateList(arrDB.branch, function (res){ docBr = res; });
  var notExt = ['.exe','.zip','.rar','.7z','.com','.dll'];

  dbhandle.settingDis((setting)=>{
    drive = setting.maindrive;
    //
    //---------------------------------- Express app handling starts here --------------------------------------------------

    //post handle show all files in the incoming folder every interval
    app.post('/sendincoming', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        sendIncoming(req, res, id);
      });
    });
    //post handle show all files in the release folder every interval
    app.post('/sendincomingrelease', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        sendIncomingRelease(req, res, id);
      });
    });
    //get handle client request for incoming docs no params
    app.get('/incoming', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getIncoming(req, res, id, false);
      });
    });
    //get handle client request for incoming docs with file as param
    app.get('/incoming/:file',function(req,res){
      utilsdocms.validToken(req, res,  function(decoded, id){
        getIncoming(req, res, id, true);
      });
    });
    //get handle client request release files
    app.get('/incoming/:file/:relfile',function(req,res){
      utilsdocms.validToken(req, res,  function(decoded, id){
        getIncoming(req, res, id, true);
      });
    });
    //post handle incoming with params
    app.post('/incoming', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function(decoded, id){
        postIncoming(req, res, id);
      });
    });
    //post to OCR scan Document to identify classification
    app.post('/incoming/scanDoc', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function(decoded, id){
        dbhandle.userFind(req.body.id, function(user){
          dbhandle.settingDis((setting)=>{
            if (setting.ai == 'true'){
              scanocr.outtext(publicstr+ req.body.path, function(data){
                fs.writeFile(drive + 'textML/'+req.body.fileroute+'.txt', data, function (err){
                  res.json(user.path);
                });
              });
            } else res.json(user.path);
          });
        });
      });
    });
    //post to AI analyze Document
    app.post('/incoming/analyzeClass', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function(decoded, id){
        console.log('Running AI');
        dbhandle.settingDis((setting)=>{
          if (setting.ai == 'true'){
            utilsdocms.runPy('./AI/ClassDoc/docPred.py', drive + 'textML/'+req.body.fileroute+'.txt').then(function(data){
              console.log(data.toString());
              res.json(data.toString());
            });
          } else res.json('');
        });
      });
    });
    //post to AI analyze Document according to branches
    app.post('/incoming/analyzeBranch', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function(decoded, id){
        console.log('Running AI');
        dbhandle.settingDis((setting)=>{
          if (setting.ai == 'true'){
            utilsdocms.runPy('./AI/ClassBranch/docPred.py', drive + 'textML/'+req.body.fileroute+'.txt').then(function(data){
              console.log(data.toString());
              res.json(data.toString());
            });
          } else res.json('');
        });
      });
    });
    //html get login
    app.get('/', function(req, res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        dbhandle.userFind(id, function(user){
          if (user.level.toUpperCase()=='SYSADMIN') return res.redirect('/kalikot');
          else return res.redirect('/dashlogs');
        });
      });
    });
    //html get filter access to public drive folder
    app.use('/drive', function(req, res, next){
      utilsdocms.validToken(req, res,  function (decoded, id){
        if (decoded) next();
      });
    });
    //Logout
    app.get('/logout', function(req, res){
      res.clearCookie("token");
      req.logout();
      return res.render('login', {layout:'empty', error:'Valid'});
    });
    //html editing document online (not yet supported)
    app.get('/edit',function(req,res){
      utilsdocms.validToken(req, res,  function(decoded){
        res.render('editmce');
      });
    });
    //
    //------------------------------------------FUNCTIONS START HERE----------------------------------------------------
    //process branch incoming files notification
    function sendIncomingRelease(req, res, id) {
      dbhandle.userFind(id, function(user){
        if (user){
          if ((user.level.toUpperCase()==='DUTYADMIN') || (user.level.toUpperCase()==='SECRETARY')){
            fs.readdir(drivetmp +'Release', function(err,items){
              let sortArr = utilsdocms.checkPermission(items, drivetmp +'Release/');
              if (err) console.log(err);
              res.json(JSON.stringify(sortArr));
            });
          }
        }
      });
    }

    //process branch incoming files notification
    function sendIncoming(req, res, id){
      dbhandle.userFind(id, function(user){
        if (user){
          if ((user.level.toUpperCase()=='DUTYADMIN') || (user.level.toUpperCase()=='SECRETARY')){
            fs.readdir(drivetmp +'incoming-temp', function(err,items){
              if (!err) {
                let sortArr = utilsdocms.checkPermission(items, drivetmp +'incoming-temp/');
                let newArr = [];
                sortArr.forEach((item)=>{
                  newArr.push({action:'yes',file:item});
                });
                let outRes = {incoming:newArr,mail:user.mailfiles};
                res.json(JSON.stringify(outRes));
              }
            });
          }else {
            fs.readdir(drivetmp + user.group, function(err,items){
              if (!err) {
                let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
                let newArr = [];
                sortArr.forEach((item, idx)=>{
                  monitoring.findLastBranch(item, user.group, function(found){
                    if (found) newArr.splice(idx,0,{action:'yes',file:item});
                    else newArr.splice(idx,0,{action:'no',file:item});
                    if (newArr.length == sortArr.length) {
                      let outRes = {incoming:newArr,mail:user.mailfiles};
                      res.json(JSON.stringify(outRes));
                    }
                  });
                });
              }
            });
          }
        }
      });
    }
    //process post incoming Function
    function postIncoming(req,res,id){
      dbhandle.userFind(req.body.user, function(user){
        var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
        utilsdocms.makeDir(drive + 'Routing Slip/',year, month);
        if (((user.level.toUpperCase()=='DUTYADMIN') || (user.level.toUpperCase()=='SECRETARY')) && (req.body.save=='incomingroute')){
          utilsdocms.validateQRPass(req.body.user,req.body.hashval, function (valid){
            if (valid) {
              dbhandle.actlogsCreate(id, Date.now(), 'Route Document with Duty Admin Privilege to: ' + req.body.branch.toString(), req.body.fileroute, req.ip);
              if (fs.existsSync(path.resolve(drivetmp+"incoming-temp/" + req.body.fileroute))){
                console.log('post incoming route duty');
                routeduty.routeThis(req,res,drivetmp + 'incoming-temp', drivetmp, drive +'incoming/', docBr, user.level, user.group, (succ)=>{
                  if (succ) monitoring.addBrMonitor(req,res, user, path.resolve(drivetmp));
                });
              } else return res.json('fail');
            } else return res.json('fail');
          });
        } else if ((user.level.toUpperCase()==='DEP') || (user.level.toUpperCase()==='CO') || (user.level.toUpperCase()==='EAGM') || (user.level.toUpperCase()==='GM')){
          if (req.body.save=='return'){ //return to branch
            if (fs.existsSync(path.resolve(drivetmp + user.group + "/" + req.body.fileroute))){
              console.log('post incoming return to branch');
              monitoring.getOriginator(req.body.fileroute, function(branch){
                dbhandle.actlogsCreate(id, Date.now(), 'Return Document to Branch: ' + branch.toString(), req.body.fileroute, req.ip);
                if (branch.toUpperCase()==user.group.toUpperCase()) branch = "N6F";
                routeduty.routNoRefEnc(req,res,drivetmp + user.group + "/", drivetmp + branch + '/');
                monitoring.addRouteOnly(req.body.fileroute, branch, path.resolve(drivetmp));
              });
            } else return res.redirect('/incoming');
          }
        } else { //if not duty admin
          if (req.body.save=='save'){ //but save to folders
            dbhandle.actlogsCreate(id, Date.now(), 'Save Document to Branch Folders', req.body.fileroute, req.ip);
            if (fs.existsSync(path.resolve(drivetmp+user.group + "/" + req.body.fileroute))) {
              console.log('post incoming save branch');
              routeduty.saveThis(req,res, drivetmp + user.group, drive + user.group + "/");
              monitoring.updateMonitor(req, res);
              utilsdocms.addTag(arrDB.tag, req.body.tag); //add additional hash tags for the documents
              //save a copy to temp monitoring
              dbhandle.monitorFindFile(req.body.fileroute, (result)=>{
                if (result) {
                  dbhandle.tempmonitorFindFile(req.body.fileroute, function(tempresult){
                    if (tempresult) {
                      dbhandle.tempmonitorDel(req.body.filename, function() {dbhandle.tempmonitorCreate(result.title,result.filename, result.route, result.filepath);});
                    } else dbhandle.tempmonitorCreate(result.title,result.filename, result.route, result.filepath);
                  });
                }
              });
            } else return res.redirect('/incoming');
          } else if (req.body.save=='incomingroute') { //branch routes doc to other branch
            console.log('post incoming route branch');
            utilsdocms.validateQRPass(req.body.user,req.body.hashval, function (valid){
              if (valid) {
                dbhandle.actlogsCreate(id, Date.now(), 'Route Document with non-Duty Admin Privilege to:' + req.body.branch.toString(), req.body.fileroute, req.ip);
                monitoring.getOriginator(req.body.fileroute, function(branch){
                  if ((branch.toUpperCase() != user.group.toUpperCase()) && (branch!='')) {
                    monitoring.findLastBranch(req.body.fileroute, user.group.toUpperCase(), (boolRet)=>{
                      if ((boolRet) || (req.body.branch.includes(branch.toUpperCase())) || (branch.toUpperCase() =='ALL BRANCHES')) {
                        routeduty.routNoRefEncIncoming(req,res,drivetmp + user.group + "/", docBr);
                        monitoring.addRouteOnly(req.body.fileroute, req.body.branch, path.resolve(drivetmp));
                      }  else res.json('noroute');
                    })
                  } else {
                    routeduty.routeThis(req, res, drivetmp + user.group + "/", drivetmp, drive +'incoming/', docBr, user.level, user.group, (succ)=>{
                      if (succ){
                        monitoring.addBrMonitor(req, res, user, path.resolve(drivetmp));
                        if (!req.body.branch.toString().toUpperCase().includes('ALL BRANCHES'))
                        dbhandle.docDel(drivetmp + user.group + "/" +req.body.fileroute,()=>{});
                      }
                    });
                  }
                });
              } else res.json('fail');
            });
          }
        }
        //if save metadata by all level of users
        if (req.body.save=='update'){
          console.log('post incoming update file');
          dbhandle.actlogsCreate(id, Date.now(), 'Save Metadata of the document', req.body.fileroute, req.ip);
          routeduty.updateThis(req, res, drive + user.group + "/", (succ)=>{
            if (succ) {
              monitoring.updateMonitor(req, res);
              utilsdocms.addTag(arrDB.tag, req.body.tag); //add additional hash tags for the documents
            }
          });

        } else if (req.body.save=='openroute'){
          console.log('post incoming route file');
          dbhandle.actlogsCreate(id, Date.now(), 'Route Document from File Server to: '+ req.body.branch.toString(), req.body.fileroute, req.ip);
          utilsdocms.validateQRPass(req.body.user,req.body.hashval, function (valid){
            if (valid) {
              routeduty.routeThis(req, res, req.body.path + "/", drivetmp, drive +'incoming/', docBr, user.level, user.group, (succ)=>{
                if (succ) monitoring.UpdFileMonitor(req, res, path.resolve(drivetmp),  user.group, user.level);
              });

            }else res.json('fail');
          });

        } else if (req.body.save=='archive') {
          if (fs.existsSync(path.resolve(drivetmp+'Release/' + req.body.fileroute))){
            dbhandle.monitorFindFile(req.body.fileroute, (result)=>{ //delete from monitoring
              if (result) dbhandle.monitorDel(req.body.fileroute,()=>{});
            });
            dbhandle.tempmonitorFindFile(req.body.fileroute, function(tempresult){ //delete from temp monitoring
              if (tempresult) dbhandle.tempmonitorDel(req.body.fileroute,()=>{});
            });

            console.log('post incoming save to archive');
            utilsdocms.makeDir(drive + 'Archive/',year, month);
            routeduty.savenochange(req,res, drivetmp+"Release", drive + "Archive/" + year +'/'+month+'/');
            dbhandle.actlogsCreate(id, Date.now(), 'Released document deleted', req.body.fileroute, req.ip);
          } else return res.redirect('/incoming');

        } else if (req.body.save=='transfer') {
          dbhandle.actlogsCreate(id, Date.now(), 'Transfer Document to Server Incoming Folder', req.body.fileroute, req.ip);
          let dissrc = path.resolve(drivetmp+'incoming-temp/' + req.body.fileroute);
          let disdst = drive + 'incoming/' + req.body.newfile
          if (fs.existsSync(dissrc)) {
            console.log('post incoming transfer to incoming');
            if (!fs.existsSync(drive + 'incoming/')) fs.mkdirSync(drive + 'incoming/');
            fs.copyFileSync(dissrc, disdst);
            fs.unlink(dissrc, async function(err) {
              if (err) {console.log(err); return res.json('fail');}
              console.log('File was removed from temp');
              return await res.json('successful');
            });
          } else return res.redirect('/incoming');
        }
      });
    }
    //Process get incoming function
    function getIncoming(req, res, id, boolFile){
      //refresh lists
      let signRes = [];
      dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
      dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
      dbhandle.userFind(id, function(user){
        dbhandle.groupFind(user.group, function (groups){
          if ((user.level.toUpperCase()==='DUTYADMIN') || (user.level.toUpperCase()==='SECRETARY')) {
            var disDrive = '/drive/';
            disReadDir = new promise((resolve, reject)=>{
              fs.readdir(drivetmp +'incoming-temp',(err,files)=>{
                let sortArr = utilsdocms.checkPermission(files, drivetmp +'incoming-temp/');
                if (err) reject(err); var def="empty"; let items = sortArr;
                if (items.length > 0) {def=items[0];} let disFile = def;
                if ((boolFile) && (req.params.file!='release')) {disFile = req.params.file; if (!fs.existsSync(drivetmp + 'incoming-temp/'+ disFile)) disFile = def;}
                else if ((boolFile) && (req.params.file=='release')) {disFile = req.params.relfile; }
                resolve({disFile:disFile,items:items});
              });
            }).then((items)=>{
              var relitems = [];
              let disRelease = new promise((resolve, reject)=>{
                fs.readdir(drivetmp +'Release', function(err,files){
                  let sortArr = utilsdocms.checkPermission(files, drivetmp +'Release/');//here
                  if (err) reject(err);
                  resolve({disFile:items.disFile,items:items.items,release:sortArr});
                });
              }).then((params)=>{
                let disFile = params.disFile, items = params.items, relitems = params.release;
                utilsdocms.resolveRoutingSlip(null, disFile);
                if (req.params.file!='release'){ //if not in release folder
                  if ((dochandle.getExtension(disFile)!='.pdf') && (disFile!='empty')){
                    if (!notExt.includes(dochandle.getExtension(disFile).toLowerCase())){
                      dochandle.convDoctoPDF(drivetmp + 'incoming-temp/'+ disFile, drivetmp + 'PDF-temp/'+ disFile +'.pdf',function(){
                        return res.render('incomingadmin', { layout:'layout-receive', signres:signRes, realdrive:drive, level:user.level, release:relitems, branch:'incoming-temp', mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'PDF-temp/'+ disFile + '.pdf', files:items, disp:disFile, docBr:docBr});
                      });
                    } else {
                      return res.render('incomingadmin', { layout:'layout-receive', signres:signRes, realdrive:drive, level:user.level, release:relitems, branch:'incoming-temp', mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'No Pending Files.pdf', files:items, disp:disFile, docBr:docBr});
                    }
                  } else {
                    if (disFile!='empty') signRes = utilsdocms.verifySign(drivetmp + 'incoming-temp/' + disFile);
                    if (JSON.stringify(signRes)!='[]') { if (signRes.message.includes("subfilter")) signRes = [];}
                    return res.render('incomingadmin', { layout:'layout-receive', signres:signRes, realdrive:drive, level:user.level, release:relitems, branch:'incoming-temp', mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'incoming-temp/'+ disFile, files:items, disp:disFile, docBr:docBr});
                  }
                } else { //if in release folder
                  if ((dochandle.getExtension(disFile)!='.pdf') && (disFile!='empty')){
                    dochandle.convDoctoPDF(drivetmp + 'Release/'+ disFile, drivetmp + 'PDF-temp/'+ disFile +'.pdf', function(){
                      return res.render('incomingadmin', { layout:'layout-receive', signres:signRes, realdrive:drive, level:user.level, release:relitems, branch:'Release', mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'PDF-temp/'+ disFile + '.pdf', files:items, disp:disFile, docBr:docBr});
                    });
                  }else {
                    if (disFile!='empty') signRes = utilsdocms.verifySign(drivetmp + 'Release/'+ disFile);
                    if (JSON.stringify(signRes)!='[]') { if (signRes.message.includes("subfilter")) signRes = [];}
                    return res.render('incomingadmin', { layout:'layout-receive', signres:signRes, realdrive:drive, level:user.level, release:relitems, branch:'Release', mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'Release/'+ disFile, files:items, disp:disFile, docBr:docBr});
                  }
                }
              }).catch((err)=>{ console.log(err);});
            }).catch((err)=>{console.log(err);});
          } else if ((user.level.toUpperCase()==='DEP') || (user.level.toUpperCase()==='CO') || (user.level.toUpperCase()==='EAGM') || (user.level.toUpperCase()==='GM')) {
            if (!fs.existsSync(drivetmp + user.group)) fs.mkdirSync(drivetmp + user.group);
            fs.readdir(drivetmp + user.group, function(err,items){
              let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
              if (err) console.log(err); var def="empty";
              if (sortArr.length > 0) {def=sortArr[0];} var disDrive = '/drive/';var disFile = def;
              if (boolFile) disFile = req.params.file;
              if (!fs.existsSync(drivetmp + user.group +'/'+disFile)) disFile = def;
              dbhandle.docFind(drivetmp + user.group +'/'+disFile, function (found) {
                let disCat = 'none';
                if (found) disCat = found.category;
                utilsdocms.resolveRoutingSlip(found, disFile);
                if (fs.existsSync(drivetmp + 'PDF-temp/'+id+'.res.pdf')) fs.unlink(drivetmp + 'PDF-temp/'+id+'.res.pdf',()=>{});
                if ((dochandle.getExtension(disFile)!='.pdf') && (disFile!='empty')){
                  dochandle.convDoctoPDF(drivetmp + user.group +'/'+disFile,drivetmp + 'PDF-temp/'+disFile +'.pdf', function(){
                    return res.render('incomingroyal', {layout:'layout-royal', signres:signRes, realdrive:drive, level:user.level, category:disCat, mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'PDF-temp/'+ disFile +'.pdf', files:sortArr, disp:disFile, branch:user.group});
                  });
                }else {
                  if (disFile!='empty') signRes = utilsdocms.verifySign(drivetmp + user.group +'/'+ disFile);
                  if (JSON.stringify(signRes)!='[]') { if (signRes.message.includes("subfilter")) signRes = [];}
                  return res.render('incomingroyal', {layout:'layout-royal', signres:signRes, realdrive:drive, level:user.level, category:disCat, mailfiles:user.mailfiles, docPers:groups, path:disDrive + user.group +'/'+ disFile, files:sortArr, disp:disFile, branch:user.group});
                }
              });
            });
          } else {
            if (!fs.existsSync(drivetmp + user.group)) fs.mkdirSync(drivetmp + user.group);
            fs.readdir(drivetmp + user.group, function(err,items){
              let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
              if (err) console.log(err);var def="empty";
              if (sortArr.length > 0) {def=sortArr[0];} var disDrive = '/drive/';var disFile = def;
              if (boolFile) disFile = req.params.file;
              if (!fs.existsSync(drivetmp + user.group +'/'+disFile)) disFile = def;
              let editFile = path.resolve(drive +'Recoverhere/'+ user.group.toUpperCase() + '/' + disFile);
              if (fs.existsSync(editFile)) {
                fs.copyFileSync(editFile,drivetmp + user.group +'/'+disFile);
                fs.unlinkSync(editFile);
              }
              dbhandle.docFind(drivetmp + user.group +'/'+disFile, function (found){
                utilsdocms.resolveRoutingSlip(found, disFile);
                monitoring.getOriginator(disFile, function(branch){
                  let runScanAI = 'true';
                  if ((branch=='')||(branch.toUpperCase()==user.group.toUpperCase())) runScanAI = 'true';
                  else  runScanAI = 'false';
                  if ((dochandle.getExtension(disFile)!='.pdf') && (disFile!='empty')){
                    dochandle.convDoctoPDF(drivetmp + user.group +'/'+disFile,drivetmp + 'PDF-temp/'+disFile +'.pdf', function(){
                      return res.render('incomingbranch', {layout:'layout-user',  signres:signRes, realdrive:drive, level:user.level, runscanai:runScanAI, mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'PDF-temp/'+ disFile +'.pdf', files:items, disp:disFile, branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag});
                    });
                  }else {
                    if (disFile!='empty') signRes = utilsdocms.verifySign(drivetmp + user.group +'/'+ disFile);
                    if (JSON.stringify(signRes)!='[]') { if (signRes.message.includes("subfilter")) signRes = [];}
                    return res.render('incomingbranch', {layout:'layout-user', signres:signRes, realdrive:drive, level:user.level,  runscanai:runScanAI, mailfiles:user.mailfiles, docPers:groups, path:disDrive + user.group +'/'+ disFile, files:items, disp:disFile, branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag});
                  }
                });
              });
            });
          }
        });
      });
    };

  });
};
