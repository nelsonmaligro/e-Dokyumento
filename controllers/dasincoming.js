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
  var drivetmp = "public/drive/", drive = "D:/Drive/", publicstr='public', topmgmt='GM';
  dbhandle.settingDis((setting)=>{drivetmp = setting.publicdrive;});
  dbhandle.settingDis((setting)=>{publicstr = setting.publicstr;});
  dbhandle.settingDis((setting)=>{topmgmt = setting.topmgmt;});

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
          if (user.level.toUpperCase()==='SECRETARY'){
            fs.readdir(drivetmp +'Release', function(err,items){
              items = items.filter(file => {return fs.statSync(drivetmp +'Release/'+file).isFile();});
              if (items.length > 0){
                let sortArr = utilsdocms.checkPermission(items, drivetmp +'Release/');
                if (err) console.log(err);
                res.json(JSON.stringify(sortArr));
              } else res.json(JSON.stringify([]));

            });
          }
        }
      });
    }

    //process branch incoming files notification
    function sendIncoming(req, res, id){
      try {
        dbhandle.userFind(id, function(user){
          if (user){
            if (user.level.toUpperCase()=='SECRETARY'){
              fs.readdir(drivetmp +'incoming-temp', function(err,items){
                if (!err) {
                  if (items.length > 0) {
                    let sortArr = utilsdocms.checkPermission(items, drivetmp +'incoming-temp/');
                    sortArr = sortArr.filter(file => {return fs.statSync(drivetmp +'incoming-temp/'+file).isFile();});
                    let newArr = [];
                    sortArr.forEach((item)=>{
                      newArr.push({action:'yes',file:item});
                    });
                    let outRes = {incoming:newArr,mail:user.mailfiles};
                    res.json(JSON.stringify(outRes));
                  } else res.json(JSON.stringify({incoming:'null',mail:user.mailfiles}));
                } else res.json(JSON.stringify({incoming:'null',mail:user.mailfiles}));
              });
            } else {
              fs.readdir(drivetmp + user.group, function(err,items){
                if (!err) {
                  if (items.length > 0) {
                    let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
                    sortArr = sortArr.filter(file => {return fs.statSync(drivetmp + user.group + '/'+file).isFile();});
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
                  } else res.json(JSON.stringify({incoming:'null',mail:user.mailfiles}));

                } else res.json(JSON.stringify({incoming:'null',mail:user.mailfiles}));
              });
            }
          }
        });
      } catch(err){console.log(err);}


    }
    //process post incoming Function
    function postIncoming(req,res,id){
      dbhandle.userFind(req.body.user, function(user){
        var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
        utilsdocms.makeDir(drive + 'Routing Slip/',year, month);
        if (!fs.existsSync(drivetmp + user.group)) fs.mkdirSync(drivetmp + user.group); //ensure directory exist
        if (!fs.existsSync(drive + user.group)) fs.mkdirSync(drive + user.group); //ensure directory exist
        //Determine user action
        switch (req.body.save) {
          case 'incomingroute': //for routing within web temp folder (incoming)
            utilsdocms.validateQRPass(req.body.user,req.body.hashval, function (valid) {
            if (valid) { //if valid user of eDokyu
              switch(user.level.toUpperCase()) {
                case 'SECRETARY': //if SECRETARY....(for executive, refer to dasroyalty.js)
                  dbhandle.actlogsCreate(id, Date.now(), 'Route Document with Secretary Privilege to: ' + req.body.branch.toString(), req.body.fileroute, req.ip);
                  if (fs.existsSync(path.resolve(drivetmp+"incoming-temp/" + req.body.fileroute))) {
                    console.log('post incoming route secretary');
                    routeduty.routeThis(req,res,drivetmp + 'incoming-temp', drivetmp, drive +'incoming/', docBr, user.level, user.group, (succ)=>{
                      if (succ) monitoring.UpdFileMonitor(req,res, user, path.resolve(drivetmp));
                    });
                  } else return res.json('fail'); //file no longer exist
                  break;
                case 'MANAGER': case 'STAFF': //if branch manager and staff....(for executive, refer to dasroyalty.js)
                  console.log('post incoming route branch');
                    dbhandle.actlogsCreate(id, Date.now(), 'Route Document to:' + req.body.branch.toString(), req.body.fileroute, req.ip);
                    monitoring.getOriginator(req.body.fileroute, function(branch) {
                      if ((branch.toUpperCase() != user.group.toUpperCase()) && (branch!='')) { //if not the orginator of the document
                          routeduty.routNoRefEncIncoming(req,res,drivetmp + user.group + "/", docBr);
                            monitoring.addRouteOnly(req.body.fileroute, req.body.branch, path.resolve(drivetmp));
                      } else { //if originator of the document
                        routeduty.routeThis(req, res, drivetmp + user.group + "/", drivetmp, drive +'incoming/', docBr, user.level, user.group, (succ)=>{
                          if (succ){
                            monitoring.UpdFileMonitor(req, res, user, path.resolve(drivetmp));
                            //monitoring.addRouteOnly(req.body.fileroute, req.body.branch, path.resolve(drivetmp));
                            if (!req.body.branch.toString().toUpperCase().includes('ALL BRANCHES')) //if not routed to all branches
                            dbhandle.docDel(drivetmp + user.group + "/" +req.body.fileroute,()=>{});
                          }
                        });
                      }
                  });
                  break;
                } //end switch for user level here
              } else return res.json('fail'); //if not a legitimate user of the eDokyu
            });
            break; //end incoming route action here
          case 'save': //if saving of document from web temp folder to server/drive
            dbhandle.actlogsCreate(id, Date.now(), 'Save Document to Branch Folders', req.body.fileroute, req.ip);
            if (fs.existsSync(path.resolve(drivetmp+user.group + "/" + req.body.fileroute))) { //if file exist
              console.log('post incoming save branch');
              routeduty.saveThis(req,res, drivetmp + user.group, drive + user.group + "/"); //save to specific classification and tags
              monitoring.updateMonitor(req, res); //update monitoring
              utilsdocms.addTag(arrDB.tag, req.body.tag); //add additional hash tags for the documents
              //save a copy to temp monitoring...later it can be retrieved if deleted from the main monitoring
              dbhandle.monitorFindTitle(req.body.fileroute, (result)=>{
                if (result) {
                  dbhandle.tempmonitorFindFile(req.body.fileroute, function(tempresult){
                    if (tempresult) {
                      disFile = req.body.fileroute; if (req.body.filename!=null) disFile = req.body.filename
                      dbhandle.tempmonitorDel(disFile, function() {dbhandle.tempmonitorCreate(result.title,result.filename, result.route, result.filepath);});
                    } else dbhandle.tempmonitorCreate(result.title,result.filename, result.route, result.filepath);
                  });
                }
              });
            } else return res.redirect('/incoming'); //if file no longer exist, then reload the client page
            break;
          case 'return': //if returning of document to originating branch (for executives only)
            if (fs.existsSync(path.resolve(drivetmp + user.group + "/" +req.body.fileroute))) { //if file exist
              console.log('post incoming return to branch');
              monitoring.getOriginator(req.body.fileroute, function(branch){
                dbhandle.actlogsCreate(id, Date.now(), 'Return Document to Branch: ' + branch.toString(), req.body.fileroute, req.ip);
                //if the originator is the executive or All branches (no originator) then return to secretary
                if ((branch.toUpperCase()==user.group.toUpperCase()) || (branch.toUpperCase()=='ALL BRANCHES')) branch = "incoming-temp";
                new Promise((resolve,reject)=> { //update routing slip
                  dbhandle.monitorFindTitle(req.body.fileroute, function (file){
                    if (file) {
                      let cnt = file.route.length + 1; //count routed branch to estimate line location
                      dbhandle.docFind(drivetmp + user.group +'/'+req.body.fileroute, function (found){
                        if (found) {
                            if (!fs.existsSync(drivetmp+'PDF-temp/route-'+req.body.fileroute+".pdf")) fs.copyFileSync(drivetmp+'routeblank.pdf', drivetmp+'PDF-temp/route-'+req.body.fileroute+".pdf")
                            pdflib.addSignRoutePDF(user.level, cnt, found.routeslip, path.resolve(drivetmp+'PDF-temp/route-')+req.body.fileroute+".pdf", req, user.group, () =>{
                            resolve();
                          });
                        } else resolve();
                      });
                    } else resolve();
                  });
                }).then(()=>{ // route back to originating branch and update monitoring
                  routeduty.routNoRefEnc(req,res,drivetmp + user.group + "/", drivetmp + branch + '/');
                  monitoring.addRouteOnly(req.body.fileroute, branch, path.resolve(drivetmp));
                }).catch();
              });
            } else return res.redirect('/incoming'); //if file no longer exist, then reload the client page
            break;
          case 'update': //updating metadata of document for openned file
            console.log('post incoming update file');
            dbhandle.actlogsCreate(id, Date.now(), 'Save Metadata of the document', req.body.fileroute, req.ip);
            routeduty.updateThis(req, res, drive + user.group + "/", (succ)=>{
              if (succ) { //update monitoring
                monitoring.updateMonitor(req, res);
                utilsdocms.addTag(arrDB.tag, req.body.tag); //add additional hash tags for the documents
              }
            });
            break;
          case 'openroute': //routing of document from server drive to web temp folder
            console.log('post open file for routing');
            dbhandle.actlogsCreate(id, Date.now(), 'Route Document from File Server to: '+ req.body.branch.toString(), req.body.fileroute, req.ip);
            utilsdocms.validateQRPass(req.body.user,req.body.hashval, function (valid){
              if (valid) {
                routeduty.routeThis(req, res, req.body.path + "/", drivetmp, drive +'incoming/', docBr, user.level, user.group, (succ)=>{
                  if (succ) monitoring.UpdFileMonitor(req, res, user, path.resolve(drivetmp));
                });
              }else res.json('fail');
            });
            break;
          case 'archive': //for archiving of documents from web temp folder to server drive/archive
            if (fs.existsSync(path.resolve(drivetmp+'Release/' + req.body.fileroute))){
              dbhandle.monitorFindTitle(req.body.fileroute, (result)=>{ //delete from monitoring
                if (result) dbhandle.monitorDel(result.filename,()=>{});
              });
              dbhandle.tempmonitorFindFile(req.body.fileroute, function(tempresult){ //delete from temp monitoring
                if (tempresult) dbhandle.tempmonitorDel(req.body.fileroute,()=>{});
              });
              console.log('post incoming transfer to archive');
              utilsdocms.makeDir(drive + 'Archive/',year, month);
              routeduty.savenochange(req,res, drivetmp+"Release", drive + "Archive/" + year +'/'+month+'/');
              dbhandle.actlogsCreate(id, Date.now(), 'Released document deleted', req.body.fileroute, req.ip);
            } else return res.redirect('/incoming');
            break;
          case 'transfer': //for transferring non-routable documents....transfer document from web temp to server drive/incoming
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
            break;
        } //end switch for user actions
      }); //end user find callback function
    }
    //Process get incoming function
    function getIncoming(req, res, id, boolFile){
      //initialize and refresh lists
      let signRes = [], disDrive = '/drive/', relitems = [];
      dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
      dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });

      dbhandle.userFind(id, function(user){
        if (!fs.existsSync(drivetmp + user.group)) fs.mkdirSync(drivetmp + user.group); //ensure web temp folder exist
        dbhandle.groupFind(user.group, function (groups) { //get all users in same group
          new promise((resolve, reject)=>{ //check for presence of metadata file in the web temp folder
            if ((boolFile) && (fs.existsSync(drivetmp + user.group +'/metadata/'+req.params.file+'.txt'))) {
              utilsdocms.metafiletoarray(req.params.file, drivetmp + user.group +'/metadata/', (ref, enc, comment)=>{
                dbhandle.docFind(drivetmp + user.group +'/'+req.params.file, (found) => {
                  if (!found) dbhandle.docCreate(utilsdocms.generateID(), req.params.file, drivetmp + user.group +'/'+req.params.file, '', id, [], Date.now().toString(), fs.statSync(drivetmp + user.group +'/'+req.params.file).size, '', '', ref, enc, comment);
                  else dbhandle.docUpdateMetaComment(drivetmp + user.group +'/'+req.params.file,ref, enc, comment);
                  fs.unlinkSync(drivetmp + user.group +'/metadata/'+req.params.file+'.txt');
                  resolve();
                });
              });
            } else resolve();
          }).then(()=>{ //process document query and send back to client
            switch(user.level.toUpperCase()) {
              case 'SECRETARY': //if user level is secretary
                new promise((resolve, reject)=>{ //read files inside the incoming web temp folder
                  fs.readdir(drivetmp +'incoming-temp',(err,files)=> {
                    let result = readWebTempFolder(files,drivetmp +'incoming-temp/',req.params.file, boolFile);
                    let disFile = result.disFile, sortArr = result.sortArr;//assign result values
                    if ((boolFile) && (req.params.file=='release')) {disFile = req.params.relfile; } //if release file selected
                    resolve({disFile:disFile,items:sortArr});
                  });
                }).then((items) => { //read files inside the release web temp folder
                  new Promise((resolve,reject)=>{ //create new promise
                    fs.readdir(drivetmp +'Release', (err,files) => {
                      let sortArr = utilsdocms.checkPermission(files, drivetmp +'Release/');//here
                      sortArr = sortArr.filter(file => {return fs.statSync(drivetmp +'Release/'+file).isFile();});
                      if (err) reject(err);
                      resolve ({disFile:items.disFile,items:items.items,release:sortArr});
                    });
                  }).then((params)=>{
                    let disFile = params.disFile, items = params.items, relitems = params.release;
                    utilsdocms.resolveRoutingSlip(null, disFile); //update routing slip
                    if (req.params.file!='release'){ //if secretary opens received or incoming files
                      if ((dochandle.getExtension(disFile)!='.pdf') && (disFile!='empty')) { //if document is not pdf
                        if (!notExt.includes(dochandle.getExtension(disFile).toLowerCase())) { //if extension is supported
                          dochandle.convDoctoPDF(drivetmp + 'incoming-temp/'+ disFile, drivetmp + 'PDF-temp/'+ disFile +'.pdf',function(){
                            return res.render('incomingadmin', { layout:'layout-receive', signres:[], realdrive:drive, level:user.level, release:relitems, branch:'incoming-temp', mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'PDF-temp/'+ disFile + '.pdf', files:items, disp:disFile, docBr:docBr});
                          });
                        } else { //if extension is not supported, return empty PDF file
                          return res.render('incomingadmin', { layout:'layout-receive', signres:[], realdrive:drive, level:user.level, release:relitems, branch:'incoming-temp', mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'No Pending Files.pdf', files:items, disp:disFile, docBr:docBr});
                        }
                      } else { //if document is PDF, the verify the digital signature and return the PDF file
                        if (disFile!='empty') signRes = utilsdocms.verifySign(drivetmp + 'incoming-temp/' + disFile);
                        if (JSON.stringify(signRes)!='[]') { if ((!signRes.message.includes("signed")) && (!signRes.message.includes("Multiple Signature")))  signRes = [];}
                        return res.render('incomingadmin', { layout:'layout-receive', signres:signRes, realdrive:drive, level:user.level, release:relitems, branch:'incoming-temp', mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'incoming-temp/'+ disFile, files:items, disp:disFile, docBr:docBr});
                      }
                    } else { // if secretary opens released files
                      if ((!disFile) && (relitems.length > 0)) {console.log(relitems[0]);disFile = relitems[0];} //check if file is not selected...then select first file item
                      else if ((!disFile) && (relitems.length == 0)) disFile='empty'; //if release items are empty
                      if ((dochandle.getExtension(disFile)!='.pdf') && (disFile!='empty')) { //if document is not PDF
                        dochandle.convDoctoPDF(drivetmp + 'Release/'+ disFile, drivetmp + 'PDF-temp/'+ disFile +'.pdf', function(){
                          return res.render('incomingadmin', { layout:'layout-receive', signres:[], realdrive:drive, level:user.level, release:relitems, branch:'Release', mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'PDF-temp/'+ disFile + '.pdf', files:items, disp:disFile, docBr:docBr});
                        });
                      } else { //if document is PDF, verify digital signature and return the PDF file
                        if (disFile!='empty') signRes = utilsdocms.verifySign(drivetmp + 'Release/'+ disFile);
                        if (JSON.stringify(signRes)!='[]') { if ((!signRes.message.includes("signed")) && (!signRes.message.includes("Multiple Signature")))  signRes = [];}
                        return res.render('incomingadmin', { layout:'layout-receive', signres:signRes, realdrive:drive, level:user.level, release:relitems, branch:'Release', mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'Release/'+ disFile, files:items, disp:disFile, docBr:docBr});
                      }
                    }
                  }).catch((err)=>{console.log(err);}); //end asynchronous Promise
                }).catch((err)=>{console.log(err);}); //end asynchronous Promise
                break;
              case 'EXECUTIVE': //if executive branches
                fs.readdir(drivetmp + user.group, function(err,items) { if (err) console.log(err); //read web temp folder
                  let result = readWebTempFolder(items,drivetmp+user.group,req.params.file, boolFile);
                  let disFile = result.disFile, sortArr = result.sortArr;//assign result values
                  dbhandle.docFind(drivetmp + user.group +'/'+disFile, function (found) {
                    let disCat = 'none'; if (found) disCat = found.category; //initialize document classification
                    utilsdocms.resolveRoutingSlip(found, disFile); //update routing slip
                    //ensure that no previously signed PDF document is present in the temp folder
                    if (fs.existsSync(drivetmp + 'PDF-temp/'+id+'.res.pdf')) fs.unlink(drivetmp + 'PDF-temp/'+id+'.res.pdf',()=>{});
                    let disTop = 'false'; if (user.group.toUpperCase()==topmgmt.toUpperCase()) disTop = 'true';//get top executive management
                    utilsdocms.getExecBranch((uniqBr)=>{ //get executive branches
                      if ((dochandle.getExtension(disFile)!='.pdf') && (disFile!='empty')){ //if document is not PDF
                        dochandle.convDoctoPDF(drivetmp + user.group +'/'+disFile,drivetmp + 'PDF-temp/'+disFile +'.pdf', function(){
                          return res.render('incomingroyal', {layout:'layout-royal', signres:[], realdrive:drive, category:disCat, mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'PDF-temp/'+ disFile +'.pdf', files:sortArr, disp:disFile, branch:user.group, docBr:uniqBr, disTop:disTop});
                        });
                      } else { //if document is PDF, verify digital signature and return the PDF file
                        if (disFile!='empty') signRes = utilsdocms.verifySign(drivetmp + user.group +'/'+ disFile);
                        if (JSON.stringify(signRes)!='[]') { if ((!signRes.message.includes("signed")) && (!signRes.message.includes("Multiple Signature")))  signRes = [];}
                        return res.render('incomingroyal', {layout:'layout-royal', signres:signRes, realdrive:drive, category:disCat, mailfiles:user.mailfiles, docPers:groups, path:disDrive + user.group +'/'+ disFile, files:sortArr, disp:disFile, branch:user.group, docBr:uniqBr, disTop:disTop});
                      }
                    });
                  });
                });
                break;
              case 'STAFF': case 'MANAGER': //if Manager or Staff
                fs.readdir(drivetmp + user.group, function(err,items) { if (err) console.log(err); //read web temp folder
                  let result = readWebTempFolder(items,drivetmp+user.group,req.params.file, boolFile);
                  let disFile = result.disFile, sortArr = result.sortArr; //assign result values
                  dbhandle.docFind(drivetmp + user.group +'/'+disFile, function (found){
                    utilsdocms.resolveRoutingSlip(found, disFile); //update routing slip
                    monitoring.getOriginator(disFile, function(branch){
                      //check on going AI analysis of the document
                      let runScanAI = 'true';
                      if ((branch=='')||(branch.toUpperCase()==user.group.toUpperCase())) runScanAI = 'true';
                      else  runScanAI = 'false';

                      if ((dochandle.getExtension(disFile)!='.pdf') && (disFile!='empty')){ //if document is not PDF
                        dochandle.convDoctoPDF(drivetmp + user.group +'/'+disFile,drivetmp + 'PDF-temp/'+disFile +'.pdf', function(){
                          return res.render('incomingbranch', {layout:'layout-user',  signres:[], realdrive:drive, level:user.level, runscanai:runScanAI, mailfiles:user.mailfiles, docPers:groups, path:disDrive + 'PDF-temp/'+ disFile +'.pdf', files:sortArr, disp:disFile, branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag});
                        });
                      }else { //if document is PDF, verify digital signature and return the PDF file
                        if (disFile!='empty') signRes = utilsdocms.verifySign(drivetmp + user.group +'/'+ disFile);
                        if (JSON.stringify(signRes)!='[]') { if ((!signRes.message.includes("signed")) && (!signRes.message.includes("Multiple Signature")))  signRes = [];}
                        return res.render('incomingbranch', {layout:'layout-user', signres:signRes, realdrive:drive, level:user.level,  runscanai:runScanAI, mailfiles:user.mailfiles, docPers:groups, path:disDrive + user.group +'/'+ disFile, files:sortArr, disp:disFile, branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag});
                      }
                    });
                  });
                });
                break;
            } //end switch user level
          }).catch((err)=>{console.log(err);});
        });
      });
    };
    //function for reading web temp folder
    function readWebTempFolder(items, path, file, boolFile){
      let sortArr = utilsdocms.checkPermission(items,path + '/'); //get files with write access
      sortArr = sortArr.filter(file=>{return fs.statSync(path + '/'+file).isFile();}); //files only
      var def="empty"; if (sortArr.length > 0) {def=sortArr[0];} //default file is the first file
      var disFile = def; if (boolFile) disFile = file; //selected file is the default file
      if (!fs.existsSync(path +'/'+disFile)) disFile = def; //if file not exist the get the default file
      return {disFile, sortArr};
    }
  });
};
