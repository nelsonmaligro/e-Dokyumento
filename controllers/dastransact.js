/*
Controller Module for Handling Miscellaneous Transactions
    - It includes merging signed PDF pages, searching reference from monitoring, scanning QR COde
    merging annotated PDF pages, document DB or metada query, toggle PDF routing, sending mail notification files,
    redirect access to public drive folder


@module docTransactions
@author Nelson Maligro
@copyright 2020
@license GPL
*/
module.exports = function(app, arrDB){
  var routeduty = require('./routeduty');
  var fs = require('fs');
  var path = require('path');
  var bodyParser = require('body-parser');
  const cookieParser = require('cookie-parser');
  const express = require('express');
  const dbhandle = require('./dbhandle');
  const dochandle = require('./dochandle');
  const monitoring = require('./monitoring');
  const pdflib = require('./pdflib');
  const utilsdocms = require('./utilsdocms');
  const dateformat = require('dateformat');
  const jwt = require('jsonwebtoken');

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

  dbhandle.settingDis((setting)=>{
    drive = setting.maindrive;
    //
    //---------------------------------- Express app handling starts here --------------------------------------------------
    //post handle search monitoring for reference and enclosure prior routing
    app.post('/searchrefmonitor', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        searchrefmonitor(req, res, id);
      });
    });
    //post handle toggle continue routing or new routing slip
    app.post('/togglepdfrout', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        togglepdfrout(req, res, id);
      });
    });
    //post handle scanning of QRCode
    app.post('/scancode', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        scanCode(req, res, id);
      });
    });
    //post handle send file to user for notification
    app.post('/senduser', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        sendUser(req, res, id);
      });
    });
    //post handle merge pdf after branch signing
    app.post('/mergesigndoc', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        mergesigndoc(req, res, id);
      });
    });
    //post handle merge pdf after branch signing
    app.post('/mergedrawdoc', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        mergedrawdoc(req, res, id);
      });
    });
    //post handle merge pdf after branch signing
    app.post('/mergesigndocenc', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        mergesigndocenc(req, res, id);
      });
    });
    //post handle merge pdf after branch signing
    app.post('/mergedrawdocenc', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        mergedrawdocenc(req, res, id);
      });
    });
    //post handle document database query and send to client
    app.post('/docquery', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        docQuery(req, res, id);
      });
    });
    //
    //------------------------------------------FUNCTIONS START HERE----------------------------------------------------
    //declare bootstap static folder here to redirect access to public drive folder when token not validated
    app.use(express.static('./public'));
  //process document release after signing
    function mergedrawdoc(req, res, id){
      dbhandle.userFind(id, function(user){
          console.log('Merge document after branch annotation');
            var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
            let disNewFile = req.body.fileroute+'.'+req.body.user+'.pdf';
            let splitFile = req.cookies.fileOpn.split('/');
            let newfileOpn = req.cookies.fileOpn.replace(splitFile[splitFile.length-1],disNewFile);
            pdflib.mergePDF(publicstr+req.cookies.fileOpn, drivetmp+'PDF-temp/'+disNewFile, drivetmp+'PDF-temp/'+req.body.user+'.res.pdf', parseInt(req.body.num,10), () =>{
              //copy signed PDF from temp to next branch
              fs.copyFileSync(drivetmp+'PDF-temp/' + disNewFile, drivetmp+user.group+'/'+disNewFile); //make a copy to drive folder
              //if (fs.existsSync(drive + 'Routing Slip/'+year+'/'+month+'/route-'+req.body.fileroute+'.pdf'))
              dbhandle.docFind(drivetmp+user.group+'/'+req.body.fileroute, function (found) {
                let newID = utilsdocms.generateID();
                dbhandle.docFind(drivetmp+user.group+'/'+disNewFile, function (disfound) {
                  if (!disfound) {
                    utilsdocms.makeDir(drive + 'Routing Slip/', year, month);
                    let dstRoutSlip = drive + 'Routing Slip/'+year+'/'+month+'/route-'+disNewFile+'.pdf';
                    let webdstRoutSlip = drivetmp + 'PDF-temp/route-'+disNewFile+'.pdf';
                    if (found){
                      if (fs.existsSync(found.routeslip)) {
                        fs.copyFileSync(found.routeslip, dstRoutSlip);fs.copyFileSync(found.routeslip, webdstRoutSlip);
                      } else {fs.copyFileSync(drivetmp+'routeblank.pdf', webdstRoutSlip);fs.copyFileSync(drivetmp+'routeblank.pdf', dstRoutSlip); }
                      dbhandle.docCreate(newID, disNewFile, drivetmp+user.group+'/'+disNewFile, found.category, found.author, found.projects, found.deyt, found.size, found.content, dstRoutSlip, found.reference, found.enclosure, found.comment);
                    } else {
                      fs.copyFileSync(drivetmp+'routeblank.pdf', webdstRoutSlip); fs.copyFileSync(drivetmp+'routeblank.pdf', dstRoutSlip);
                      dbhandle.docCreate(newID, disNewFile, drivetmp+user.group+'/'+disNewFile, "", "", [], Date.now(), 0, "", dstRoutSlip, [], [], []);
                    }
                  }
                  dbhandle.monitorFindFile(req.body.fileroute, function(result){ //delete in monitoring
                    if (result) {
                      dbhandle.monitorUpdateFilename(req.body.fileroute, disNewFile);
                    }
                  });
                  res.json(disNewFile);
                  fs.unlinkSync(drivetmp+user.group+'/'+req.body.fileroute);
                });
              });
            });
      });
    }
    //process document release after signing
    function mergesigndocenc(req, res, id){
      dbhandle.userFind(id, function(user){
        utilsdocms.validateQRPass(req.body.user,req.body.hashval, function (result){
          console.log('Merge document reference after branch signature');
          if (result) {
            var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
            let disNewFile = req.body.origenc+'.'+req.body.user+'.pdf';
            pdflib.mergePDF(publicstr+req.body.filepath, drivetmp+'PDF-temp/'+disNewFile, drivetmp+'PDF-temp/'+req.body.user+'.res.pdf', parseInt(req.body.num,10), () =>{
              //copy signed PDF from temp to next branch
              fs.copyFileSync(drivetmp+'PDF-temp/' + disNewFile, req.body.realpath + disNewFile); //make a copy to drive folder
              dbhandle.docFind(drivetmp+user.group+'/'+req.body.origfile, function (found) {
                let arrEnc = []; let foundEnc = false;
                if (found) {
                  found.enclosure.forEach((filename)=>{
                      if (filename.includes(req.body.origenc)) {arrEnc.push(req.body.realpath + disNewFile); foundEnc = true;}
                      else arrEnc.push(filename);
                  })
                  dbhandle.docUpdateEncOnly(drivetmp+user.group+'/'+req.body.origfile, arrEnc);
                }
                if (foundEnc) res.json(disNewFile);
                else res.json('failref');
              });
            });
          } else res.json('fail');
        });
      });
    }
    //process document release after signing
    function mergedrawdocenc(req, res, id){
      dbhandle.userFind(id, function(user){
          console.log('Merge document enclosure after annotation');
            var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
            let disNewFile = req.body.origenc+'.'+req.body.user+'.pdf';
            //console.log(req.body.filepath, req.body.realpath, req.body.origenc,req.body.origfile);
            pdflib.mergePDF(publicstr+req.body.filepath, drivetmp+'PDF-temp/'+disNewFile, drivetmp+'PDF-temp/'+req.body.user+'.res.pdf', parseInt(req.body.num,10), () =>{
              //copy signed PDF from temp to next branch
              fs.copyFileSync(drivetmp+'PDF-temp/' + disNewFile, req.body.realpath + disNewFile); //make a copy to drive folder
              dbhandle.docFind(drivetmp+user.group+'/'+req.body.origfile, function (found) {
                let arrEnc = []; let foundEnc = false;
                if (found) {
                  found.enclosure.forEach((filename)=>{
                      if (filename.includes(req.body.origenc)) {arrEnc.push(req.body.realpath + disNewFile); foundEnc = true;}
                      else arrEnc.push(filename);
                  })
                  dbhandle.docUpdateEncOnly(drivetmp+user.group+'/'+req.body.origfile, arrEnc);
                }
                if (foundEnc) res.json(disNewFile);
                else res.json('failref');
              });
            });
      });
    }
    //process document release after signing
    function mergesigndoc(req, res, id){
      dbhandle.userFind(id, function(user){
        utilsdocms.validateQRPass(req.body.user,req.body.hashval, function (result){
          console.log('Merge document after branch signature');
          if (result) {
            var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
            let disNewFile = req.body.fileroute+'.'+req.body.user+'.pdf';
            //console.log('public'+req.body.filepath);
            pdflib.mergePDF(publicstr+req.body.filepath, drivetmp+'PDF-temp/'+disNewFile, drivetmp+'PDF-temp/'+req.body.user+'.res.pdf', parseInt(req.body.num,10), () =>{
              //copy signed PDF from temp to next branch
              fs.copyFileSync(drivetmp+'PDF-temp/' + disNewFile, req.body.realpath + disNewFile); //make a copy to drive folder
              dbhandle.docFind(req.body.realpath+req.body.fileroute, function (found) {
                let newID = utilsdocms.generateID();
                dbhandle.docFind(req.body.realpath + disNewFile, function (disfound) {
                  if (!disfound) {
                    utilsdocms.makeDir(drive + 'Routing Slip/', year, month);
                    let dstRoutSlip = drive + 'Routing Slip/'+year+'/'+month+'/route-'+disNewFile+'.pdf';
                    let webdstRoutSlip = drivetmp + 'PDF-temp/route-'+disNewFile+'.pdf';
                    if (found){
                      if (fs.existsSync(found.routeslip)) {
                        fs.copyFileSync(found.routeslip, dstRoutSlip);fs.copyFileSync(found.routeslip, webdstRoutSlip);
                      } else {fs.copyFileSync(drivetmp+'routeblank.pdf', webdstRoutSlip);fs.copyFileSync(drivetmp+'routeblank.pdf', dstRoutSlip); }
                      dbhandle.docCreate(newID, disNewFile, req.body.realpath + disNewFile, found.category, found.author, found.projects, found.deyt, found.size, found.content, dstRoutSlip, found.reference, found.enclosure, found.comment);
                    } else {
                      fs.copyFileSync(drivetmp+'routeblank.pdf', webdstRoutSlip); fs.copyFileSync(drivetmp+'routeblank.pdf', dstRoutSlip);
                      dbhandle.docCreate(newID, disNewFile, req.body.realpath + disNewFile, "", "", [], Date.now(), 0, "", dstRoutSlip, [], [], []);
                    }
                  }
                  res.json(disNewFile);
                });
              });

            });
          } else res.json('fail');
        });
      });
    }
    //process toggle continue routing or new routing slip
    function togglepdfrout(req, res, id){
      console.log('toggle previous routing slip ');
      var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
      if (req.body.toggle=='true'){
        dbhandle.monitorFindFile(req.body.filename, (result)=>{
          if (!result) {
            dbhandle.tempmonitorFindFile(req.body.filename, function(tempresult){
              if (tempresult) {
                dbhandle.monitorCopy (tempresult.title, tempresult.filename, tempresult.filepath, tempresult.route);
                dbhandle.tempmonitorDel(req.body.filename, function(){});
              }
            });
          }
        });
        if (fs.existsSync(drivetmp + 'PDF-temp/routemonitor-'+ req.body.filename +'.pdf')){
          fs.copyFileSync(drivetmp + 'PDF-temp/routemonitor-'+ req.body.filename +'.pdf', drivetmp + 'PDF-temp/route-'+ req.body.filename +'.pdf');
          fs.copyFileSync(drivetmp + 'PDF-temp/routemonitor-'+ req.body.filename +'.pdf', drive+"Routing Slip/"+year+"/"+month+"/"+"route-"+req.body.filename+".pdf");
        }
      } else {
        dbhandle.monitorFindFile(req.body.filename, (result)=>{
          if (result) {
            dbhandle.tempmonitorFindFile(req.body.filename, function(tempresult){
              if (tempresult) {
                dbhandle.tempmonitorDel(req.body.filename,()=>{
                  dbhandle.tempmonitorCreate(result.title,result.filename, result.route, result.filepath);
                  dbhandle.monitorDel(result.filename,()=>{});
                });
              } else {
                dbhandle.tempmonitorCreate(result.title,result.filename, result.route, result.filepath);
                dbhandle.monitorDel(result.filename,()=>{});
              }
            });
          }
        })
        var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
        if (fs.existsSync(drivetmp + 'routeblank.pdf')){
          fs.copyFileSync(drivetmp + 'routeblank.pdf', drivetmp+'PDF-temp/route-'+filename+".pdf");
          fs.copyFileSync(drivetmp + 'routeblank.pdf', drive+"Routing Slip/"+year+"/"+month+"/"+"route-"+filename+".pdf");
        }
      }
      res.json('toggle');
    }
    function toggleback(filename){
      if (fs.existsSync(drivetmp + 'PDF-temp/routeorig-'+ filename +'.pdf')){
        fs.copyFileSync(drivetmp + 'PDF-temp/routeorig-'+ filename +'.pdf', drivetmp + 'PDF-temp/route-'+ filename +'.pdf');
      }
    }
    //process document scan QR COde
    function searchrefmonitor(req, res, id){
      console.log('Search reference and enclosure in monitoring');
      let deyt = dateformat(Date.now(),"dd mmm yyyy HH:MM");var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
      dbhandle.monitorFindFile(req.body.filename, function (filename){
        if (!filename){
          dbhandle.tempmonitorFindFile(req.body.filename, function(disFile){
            if (!disFile) {
              monitoring.searchRefEnc(req, (resultpath, resultfile)=>{
                if (resultfile) {
                  dbhandle.docFind(resultpath+'/'+resultfile, function (found){
                    if (found){
                      if (fs.existsSync(found.routeslip)) {
                        if (!fs.existsSync(drivetmp + 'PDF-temp/routeorig-'+ req.body.filename +'.pdf')) fs.copyFileSync(drivetmp + 'PDF-temp/route-'+ req.body.filename +'.pdf', drivetmp + 'PDF-temp/routeorig-'+ req.body.filename +'.pdf');
                        fs.copyFileSync(found.routeslip, drivetmp + 'PDF-temp/routemonitor-'+ req.body.filename +'.pdf');
                        fs.copyFileSync(found.routeslip, drivetmp + 'PDF-temp/route-'+ req.body.filename +'.pdf');
                        dbhandle.tempmonitorFindFile(resultfile, function(newdisFile){
                          fs.copyFileSync(found.routeslip, drive+"Routing Slip/"+year+"/"+month+"/"+"route-"+req.body.filename+".pdf");
                          dbhandle.monitorCopy (newdisFile.title, req.body.filename, newdisFile.filepath, newdisFile.route);
                          dbhandle.tempmonitorDel(resultfile, function(){});
                          dbhandle.monitorDel(newdisFile.filename, function(){});
                          dbhandle.actlogsCreate(id, Date.now(), 'Monitoring: Title: ' + newdisFile.title +' with file '+ newdisFile.filename + ' renamed as ' +req.body.filename, newdisFile.filename, req.ip);
                          res.json(JSON.stringify({result:'found',file:req.body.filename}));
                        });
                      } else {toggleback(req.body.filename);res.json(JSON.stringify({result:'notfound',file:null}));}
                    } else {toggleback(req.body.filename);res.json(JSON.stringify({result:'notfound',file:null}));}
                  });
                } else {toggleback(req.body.filename);res.json(JSON.stringify({result:'notfound',file:null}));}
              });
            } else {
              dbhandle.monitorCopy (disFile.title, disFile.filename, disFile.filepath, disFile.route);
              dbhandle.tempmonitorDel(req.body.filename, function(){});
              toggleback(req.body.filename);
              res.json (JSON.stringify({result:'routed',file:null}));
            }
          });
        } else {toggleback(req.body.filename);res.json (JSON.stringify({result:'routed',file:null}));}
      });
    }
    //process document scan QR COde
    function scanCode(req, res, id){
      dbhandle.userFind(id, function(user){
        console.log('scan QR Code');
        utilsdocms.validateQRPass(req.body.user,req.body.hashval, function (result){
          if (result) {
            var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
            var filesrch = req.body.filename;
            if (req.body.filename != req.body.monitfile) {
              fs.copyFileSync(drivetmp+'PDF-temp/route-'+req.body.filename+".pdf", drive+"Routing Slip/"+year+"/"+month+"/"+"route-"+req.body.filename+".pdf");
              filesrch = req.body.monitfile;
            }

            dbhandle.monitorFindFile(filesrch, function (file){
              //count routed branch to estimate line location
              //console.log(req.body.filename,req.body.monitfile,filesrch, file);
              var cnt = 1;
              if (file) cnt = file.route.length + 1;
              else {
                fs.copyFileSync(drivetmp + 'routeblank.pdf', drivetmp+'PDF-temp/route-'+req.body.filename+".pdf");
                fs.copyFileSync(drivetmp + 'routeblank.pdf', drive+"Routing Slip/"+year+"/"+month+"/"+"route-"+req.body.filename+".pdf");
              }
              let disroutslip = drive+"Routing Slip/"+year+"/"+month+"/"+"route-"+req.body.filename+".pdf";
              dbhandle.docFind(drivetmp + user.group +'/'+filesrch, function (found){
                if (found) disrout = found.routeslip;
                pdflib.addSignRoutePDF(user.level, cnt, disroutslip, path.resolve(drivetmp+'PDF-temp/route-')+req.body.filename+".pdf", req, user.group, () =>{
                  res.json('successful');
                });
              });
            });
          }else {
            res.json('notok');
          }
        });
      });
    }
    //process send file to user function
    function sendUser(req, res, id){
      console.log('Send File to user for notification');
      dbhandle.userFind(req.body.user, function (user){
        //console.log(found);
        if (user){
          dbhandle.userFind(req.body.send, function(disuser){
            if (disuser) {
                routeduty.updateThis(req, res, drive + user.group + "/", (succ)=>{
                  if (succ) {
                    let found = disuser.mailfiles.find((element)=> {return element.toUpperCase()==(req.body.path+req.body.newfile).toUpperCase();});
                    if (!found) disuser.mailfiles.push(req.body.path+req.body.newfile);
                    dbhandle.userUpdate(disuser.userN, disuser.hashP, disuser.email, disuser.salt, disuser.group, disuser.level, disuser.path, disuser.mailfiles, ()=>{
                      monitoring.updateMonitor(req, res);
                      utilsdocms.addTag(arrDB.tag,req.body.tag); //add additional hash tags for the documents
                    });
                  }
                });
                dbhandle.actlogsCreate(id, Date.now(), 'Send File to User/Person: ' + req.body.send, req.body.newfile, req.ip);
            } else res.json('notfound');
          });
        }
      });
    }
    //process documnet DB query function
    function docQuery(req, res, id){
      console.log('Query Doc DB');
      var disPath= req.body.path;
      dbhandle.docFind(disPath, function (found){
        rout= "";ref = [];enc = []; disClas = ""; disTag = [];disComm = [];
        if (found){
          disComm= found.comment; rout= found.routeslip;ref = found.reference;enc = found.enclosure; disClas = found.category; disTag = found.projects;
        }
        var arrBr = [{rout:rout, ref:ref, enc:enc, disClas:disClas, disTag:disTag, disComm:disComm}];
        res.json(JSON.stringify(arrBr));
      });
    }
    //html get comment and annotate
    app.get('/edit',function(req,res){
      utilsdocms.validToken(req, res,  function(decoded){
        res.render('editmce');
      });
    });
  });
};
