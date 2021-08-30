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
  const PDFDocument = require('pdfkit');
  const nodesign = require('node-pdfsign');

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
    const signer = new nodesign.SignPdf;
    const {pdfkitAddPlaceholder, extractSignature, removeTrailingNewLine, plainAddPlaceholder} = require ('./dist/helpers');

    //
    //---------------------------------- Express app handling starts here --------------------------------------------------
    //post handle update comment
    app.post('/updatecomment', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        updatecomment(req, res, id);
      });
    });
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
    //post handle scanning of Document QR Code
    app.post('/scanqrdoc', urlencodedParser, function(req,res){
      scanqrdoc(req, res);
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
    //post open user QR code
    app.post('/showqrcode', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        showqrcode(req, res, id);
      });
    });
    //post delete QR code upon closing
    app.post('/delqrcode', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        if (fs.existsSync(drivetmp + 'PDF-temp/'+id+'.login.qr.png')) {
          fs.unlinkSync(drivetmp + 'PDF-temp/'+id+'.login.qr.png');
        }
        res.json('success');
      });
    });
    //
    //------------------------------------------FUNCTIONS START HERE----------------------------------------------------
    //declare bootstap static folder here to redirect access to public drive folder when token not validated
    app.use(express.static('./public'));
    //process show User QR COde
    function showqrcode(req, res, id){
      console.log('Show User QR Code');
      dbhandle.userFind(id, function (user){
        if (fs.existsSync(drive+user.group+'/signature/'+id+'.login.qr.png')) {
          fs.copyFileSync(drive+user.group+'/signature/'+id+'.login.qr.png', drivetmp + 'PDF-temp/'+id+'.login.qr.png');
          res.json('success');
        } else res.json('fail');
      });


    }
    //handle updating comment
    function updatecomment(req,res,id){
      dbhandle.userFind(req.body.user, function (user){
        var arrComment = JSON.parse(req.body.comments); newComm = [];
        arrComment.forEach(function (comment){
          newComm.push({branch:comment.branch, content:comment.content});
        });
        //update comments with same filename on all branches
        if (req.body.page=='incoming'){ //if file is in the incoming folder
          docBr.forEach((item, i) => {
            if (fs.existsSync(drivetmp+item+'/'+req.body.fileroute)){
              dbhandle.docFind(drivetmp+item+'/'+req.body.fileroute, function(docres){
                //check if document no record from DB
                if (!docres) dbhandle.docCreate (utilsdocms.generateID(), req.body.fileroute, drivetmp + item+'/' +req.body.fileroute, '', req.body.user, [], Date.now().toString(), 0, '', '', [], [], newComm);
                else dbhandle.docUpdateComment(drivetmp + item + '/' +req.body.fileroute, newComm);
              });
            }
          });
        } else { //if file is opened in the drive (file server)
          dbhandle.docFind(req.body.realpath+req.body.fileroute, function(docres){
            //check if document no record from DB
            if (!docres) dbhandle.docCreate (utilsdocms.generateID(), req.body.fileroute, req.body.realpath +req.body.fileroute, '', req.body.user, [], Date.now().toString(), 0, '', '', [], [], newComm);
            else dbhandle.docUpdateComment(req.body.realpath +req.body.fileroute, newComm);
          });
        }
    });
    res.json('successful');
    console.log('Save Comment Incoming');
  }
    //process document scan and verify QR COde
    function scanqrdoc(req, res){
      console.log('Scan Document QR Code');
      dbhandle.actlogFindSerial(req.body.content,(result)=>{
        if (result){
          //console.log(result[0].doc);
          if (result[0].doc.includes('.res.pdf')) return res.json('fail');
          else {
            dbhandle.userFind(result[0].user, function(user){
              let disDeyt = new Date(result[0].deyt);
              let newDeyt = disDeyt.getMonth() + '/' +disDeyt.getDate() + '/' +  disDeyt.getFullYear() + ' ' + disDeyt.getHours() + disDeyt.getMinutes() + 'H';
              let docResult = {deyt:newDeyt, name:user.email, file:result[0].doc};
              return res.json(JSON.stringify(docResult));
            });
          }
        } else return res.json('fail');
      });

    }

    //merge main document  after annotation
    function mergedrawdoc(req, res, id){
      dbhandle.userFind(id, function(user){
        console.log('Merge document after branch annotation');
        let disNewFile = req.body.fileroute+'.'+req.body.user+'.pdf';
        let splitFile = req.cookies.fileOpn.split('/');
        let newfileOpn = req.cookies.fileOpn.replace(splitFile[splitFile.length-1],disNewFile);
        pdflib.mergePDF(publicstr+req.cookies.fileOpn, drivetmp+'PDF-temp/'+disNewFile, drivetmp+'PDF-temp/'+req.body.user+'.res.pdf', parseInt(req.body.num,10), () =>{
          //copy annotated PDF from temp to all branches with same filename
          docBr.forEach((item, i) => {
            if (fs.existsSync(drivetmp+item+'/'+req.body.fileroute)) {
                //copy file to branch
                fs.copyFileSync(drivetmp+'PDF-temp/' + disNewFile, drivetmp+item+'/'+ disNewFile);
                //update DB
                dbhandle.docUpdateTitleFileOnly(disNewFile, drivetmp+item+'/'+req.body.fileroute, drivetmp+item+'/'+ disNewFile);
                //remove old documents
                fs.unlinkSync(drivetmp+item+'/'+req.body.fileroute);
            };
          });
          dbhandle.monitorUpdateFilename(req.body.fileroute, disNewFile)
        res.json(req.body.fileroute);
      });
    });
  }
    //merge enclosure document  after signing
    function mergesigndocenc(req, res, id){
      dbhandle.userFind(id, function(user){
        utilsdocms.validateQRPass(req.body.user,req.body.hashval, function (result){
          console.log('Merge document reference after branch signature');
          if (result) {
            let disNewFile = req.body.origenc+'.'+req.body.user+'.pdf';
            pdflib.mergePDF(publicstr+req.body.filepath, drivetmp+'PDF-temp/'+disNewFile, drivetmp+'PDF-temp/'+req.body.user+'.res.pdf', parseInt(req.body.num,10), () =>{
              //attached digital certificate PKCS 12 format into the PDF
              new Promise ((resolve,reject)=>{ //attache digital certificate if present
                if (fs.existsSync(drive+user.group+'/Signature/' + id +'.cert.p12')) { //if user has certificate
                  addDigitalCert(user.group, id, drivetmp+'PDF-temp/', disNewFile,()=>{
                      resolve();
                  })
                } else resolve();
              }).then(()=>{ //copy signed PDF from temp to the server drive with new filename....and update doc DB
                fs.copyFileSync(drivetmp+'PDF-temp/' + disNewFile, req.body.realpath + disNewFile); //make a copy to drive folder
                dbhandle.docFind(drivetmp+user.group+'/'+req.body.origfile, function (found) {
                  let arrEnc = []; let foundEnc = false;
                  if (found) {
                    //get enclosure, update the filename and store to array
                    found.enclosure.forEach((filename)=>{
                      if (filename.includes(req.body.origenc)) {arrEnc.push(req.body.realpath + disNewFile); foundEnc = true;}
                      else arrEnc.push(filename);
                    })
                    //update document DB to all branches with same document routed
                    docBr.forEach((item, i) => {//iterate throug branches
                      if (fs.existsSync(drivetmp+item+'/'+req.body.origfile)) {
                        dbhandle.docUpdateEncOnly(drivetmp+item+'/'+req.body.origfile, arrEnc);//update DB
                      };
                    });
                  }
                  if (foundEnc) res.json(disNewFile); //if file is an enclosure
                  else res.json('failref'); //if file is a reference....error since only enclosure can be signed
                });
              }).catch((err)=>{console.log(err);});
            });
          } else res.json('fail');
        });
      });
    }
    //merge enclosure document after annotation
    function mergedrawdocenc(req, res, id){
      dbhandle.userFind(id, function(user){
        console.log('Merge document enclosure after annotation');
        let disNewFile = req.body.origenc+'.'+req.body.user+'.pdf';
        //console.log(req.body.filepath, req.body.realpath, req.body.origenc,req.body.origfile);
        pdflib.mergePDF(publicstr+req.body.filepath, drivetmp+'PDF-temp/'+disNewFile, drivetmp+'PDF-temp/'+req.body.user+'.res.pdf', parseInt(req.body.num,10), () =>{
          //copy signed PDF from temp to next branch
          fs.copyFileSync(drivetmp+'PDF-temp/' + disNewFile, req.body.realpath + disNewFile); //make a copy to drive folder
          dbhandle.docFind(drivetmp+user.group+'/'+req.body.origfile, function (found) {
            let arrEnc = []; let foundEnc = false;
            if (found) {
              //get enclosure, update the filename and store to array
              found.enclosure.forEach((filename)=>{
                if (filename.includes(req.body.origenc)) {arrEnc.push(req.body.realpath + disNewFile); foundEnc = true;}
                else arrEnc.push(filename);
              })
              //update document DB to all branches with same document routed
              docBr.forEach((item, i) => {//iterate throug branches
                if (fs.existsSync(drivetmp+item+'/'+req.body.origfile)) {
                  dbhandle.docUpdateEncOnly(drivetmp+item+'/'+req.body.origfile, arrEnc);//update DB
                };
              });
            }
            if (foundEnc) res.json(disNewFile); //if file is an enclosure
            else res.json('failref');//if file is a reference....error since only enclosure can be annotated
          });
        });
      });
    }
    //merge main document after signing
    function mergesigndoc(req, res, id){
      dbhandle.userFind(id, function(user){
        utilsdocms.validateQRPass(req.body.user,req.body.hashval, function (result){
          console.log('Merge main document after branch signature');
          if (result) {
            let disNewFile = req.body.fileroute+'.'+req.body.user+'.pdf';
            //merge the signed page to the original document
            pdflib.mergePDF(publicstr+req.body.filepath, drivetmp+'PDF-temp/'+disNewFile, drivetmp+'PDF-temp/'+req.body.user+'.res.pdf', parseInt(req.body.num,10), () =>{
              new Promise ((resolve,reject)=>{ //attach digital certificate if present
                if (req.body.page == 'open') disRealpath = req.body.realpath;
                else disRealpath = drivetmp+'PDF-temp/';
                if (fs.existsSync(drive+user.group+'/Signature/' + id +'.cert.p12')) { //if user has certificate
                  addDigitalCert(user.group, id, disRealpath, disNewFile,()=>{
                      resolve();
                  })
                } else resolve();
              }).then(()=>{ //copy merged document to specific destination and update DB
                if (req.body.page == 'open') { //if file/open command or the file is in the server drive
                  dbhandle.docDel(req.body.realpath + disNewFile,()=>{ //delete destination doc DB to create a new
                    fs.copyFileSync(drivetmp+'PDF-temp/' + disNewFile, req.body.realpath + disNewFile); //copy the merged document to the drive folder
                    let newID = utilsdocms.generateID();
                    dbhandle.docFind(req.body.realpath+req.body.fileroute, function (found) { //search source doc DB
                      if (found) { //if found, create new doc DB and copy metadata from orig doc to new doc
                        dbhandle.docCreate(newID, disNewFile, req.body.realpath + disNewFile, found.category, found.author, found.projects, found.deyt, found.size, found.content, found.routeslip, found.reference, found.enclosure, found.comment);
                      }
                      res.json(disNewFile); //return to client
                    });
                  });
                } else { //if file is in the web temp folder then make update same filename to all branches
                  docBr.forEach((item, i) => {//iterate throug branches
                    if (fs.existsSync(drivetmp+item+'/'+req.body.fileroute)) {
                      fs.copyFileSync(drivetmp+'PDF-temp/' + disNewFile, drivetmp+item+'/'+ disNewFile);//copy file to branch as new file
                      //update DB
                      dbhandle.docUpdateTitleFileOnly(disNewFile, drivetmp+item+'/'+req.body.fileroute, drivetmp+item+'/'+ disNewFile);
                      fs.unlinkSync(drivetmp+item+'/'+req.body.fileroute); //remove old documents
                    };
                  });
                  dbhandle.monitorUpdateFilename(req.body.fileroute, disNewFile)
                  res.json(disNewFile); //return to client
                }
              }).catch((err)=>{res.json(disNewFile);}); //on error return to client
            });
          } else res.json('fail');
        });
      });
    }
    //function for adding digital certificate into document
    function addDigitalCert(group, id, realpath, disNewFile, callback){
      console.log('Add digital certificate to the signature');
      let p12Buffer = fs.readFileSync(drive+group+'/Signature/' + id +'.cert.p12');
      //convert to PDF in order to attach the digital certificate
      pdflib.convertPDFver(drivetmp+'PDF-temp/' + disNewFile, drivetmp+'PDF-temp/' + disNewFile + '.sign.pdf', function(){
      try {
        let pdfBuffer = fs.readFileSync(drivetmp+'PDF-temp/' + disNewFile + '.sign.pdf');
        pdfBuffer = removeTrailingNewLine(pdfBuffer);
        pdfBuffer = plainAddPlaceholder({ pdfBuffer, reason: 'I approved and signed this document.'});
        //read the certificate
        let buf64 = fs.readFileSync(drive+group+'/Signature/' + id +'.cert.psk',"utf8");
        buf64 = Buffer.from(buf64, 'base64');
          //attach the certificate to the PDF
          pdfBuffer = signer.sign(pdfBuffer, p12Buffer, {asn1StrictParsing: false,passphrase:buf64.toString("utf8")},);
          fs.writeFileSync(drivetmp+'PDF-temp/' + disNewFile + '.new.sign.pdf',pdfBuffer);
          fs.copyFileSync(drivetmp+'PDF-temp/' + disNewFile + '.new.sign.pdf',realpath + disNewFile); //make a copy to drive folder
          //const {signature, signedData} = extractSignature(pdfBuffer);
          //console.log(signature);
          callback();
        } catch(error) {console.log(error);callback();}
      });
    };
    //process toggle continue routing or new routing slip
    function togglepdfrout(req, res, id){
      console.log('toggle previous routing slip ');
      var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
      if (req.body.toggle=='true'){
        dbhandle.monitorFindTitle(req.body.filename, (result)=>{
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
        dbhandle.monitorFindTitle(req.body.filename, (result)=>{
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
      dbhandle.monitorFindTitle(req.body.filename, function (filename){
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
            var filesrch = req.body.filename;
            dbhandle.docFind(drivetmp + user.group +'/'+filesrch, function (found){
              var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
              //get routing slip
              let disroutslip = drive+"Routing Slip/"+year+"/"+month+"/"+"route-"+filesrch+".pdf"; //initialize
              if ((found) && (found.routeslip.trim()!='')) disroutslip = found.routeslip;
              if (req.body.filename != req.body.monitfile) { //if file is renamed at the texbox
                if (!fs.existsSync(drivetmp+'PDF-temp/route-'+req.body.filename+".pdf")) fs.copyFileSync(drivetmp+'routeblank.pdf', drivetmp+'PDF-temp/route-'+req.body.filename+".pdf")
                fs.copyFileSync(drivetmp+'PDF-temp/route-'+req.body.filename+".pdf", disroutslip);
                filesrch = req.body.monitfile;
              }
              //Update the monitoring
              dbhandle.monitorFindTitle(filesrch, function (file){
                var cnt = 1;
                if (file) cnt = file.route.length + 1; //if found in the monitoring
                else { //not found in the monitoring
                  fs.copyFileSync(drivetmp + 'routeblank.pdf', drivetmp+'PDF-temp/route-'+req.body.filename+".pdf");
                  fs.copyFileSync(drivetmp + 'routeblank.pdf', drive+"Routing Slip/"+year+"/"+month+"/"+"route-"+req.body.filename+".pdf");
                }
                //Updating routing slip
                  pdflib.addSignRoutePDF(user.level, cnt, disroutslip, path.resolve(drivetmp+'PDF-temp/route-')+req.body.filename+".pdf", req, user.group, () =>{
                    res.json('successful');
                  });
              });
            });
          } else {
            res.json('notok');
          }
        });
      });
    }
    //process send file to user function
    function sendUser(req, res, id){
      console.log('Send File to user for notification');
      dbhandle.userFind(req.body.user, function (user){
        if (user){
          dbhandle.userFind(req.body.send, function(disuser){
            if (disuser) {
              if (!fs.existsSync(drive + user.group)) fs.mkdirSync(drive + user.group);
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
