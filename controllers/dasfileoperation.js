/*
Controller Module for File Operation
- handles all file operations such as download, edit, delete, upload, open, and browsing of drive
//latest
@module fileOperation
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
  const dbhandle = require('./dbhandle');
  const dochandle = require('./dochandle');
  const monitoring = require('./monitoring');
  const pdflib = require('./pdflib');
  const utilsdocms = require('./utilsdocms');
  const dateformat = require('dateformat');
  var multer = require('multer');
  const getcontent = require('./getcontent');
  var rateLimit = require('express-rate-limit');

  //initialize url encoding, cookies, and default drive path
  app.use(cookieParser());
  var urlencodedParser = bodyParser.urlencoded({extended:true});
  var drivetmp = "public/drive/", drive = "D:/Drive/";
  dbhandle.settingDis((setting)=>{drivetmp = setting.publicdrive;});

  //list all branches, classifications and tags
  var docClass = []; var docTag = []; var docBr = [];    var grpUsrs = [];
  dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
  dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
  dbhandle.generateList(arrDB.branch, function (res){ docBr = res; });

  dbhandle.settingDis((setting)=>{
    drive = setting.maindrive;
    //initialize file upload storage
    var storage =   multer.diskStorage({
      destination: function (req, file, callback) { callback(null, drivetmp +'Uploads/'); },
      filename: function (req, file, callback) { callback(null, file.originalname);}
    });
    var upload = multer({ storage : storage}).single('fileinput');
    //
    //---------------------------------- Express app handling starts here --------------------------------------------------
    // set up rate limiter: maximum of 5000 requests per minute
    var limiter =  rateLimit({
      windowMs: 1*60*1000, // 1 minute
      max: 5000
    });
    app.use(limiter);

    //post handle explorer show file
    app.post('/explorershow', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postExplorerShow(req, res, id);
      });
    });
    //get handle Explorer
    app.get('/explorer', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getExplorer(req, res, id);
      });
    });
    //post handle file open with params
    app.post('/fileopen', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postFileopen(req, res, id);
      });
    });
    //get open file no params
    app.get('/fileopen', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getFileopen(req, res, id);
      });
    });
    //post handle show file attachments
    app.post('/showfile', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,   function (decoded, id){
        showFile(req, res, id);
      });
    });
    //get handle download file from current client view
    app.get('/downloadfile/:file/:view', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        downloadfile(req, res, id);
      });
    });
    //post handle delete file
    app.post('/deletedoc', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        deletedoc(req, res, id);
      });
    });
    //post handle save metadata on file open
    app.post('/savemetadata', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        savemetadoc(req, res, id);
      });
    });
    //post handle save metadata on file open
    app.post('/savemetatofile', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        savemetatofile(req, res, id);
      });
    });
    //post handle edit file within client incoming view
    app.post('/editincoming', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        editincoming(req, res, id);
      });
    });
    //post handle edit file within client incoming view
    app.post('/returnrelease', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        returnrelease(req, res, id);
      });
    });
    //get handle upload file
    app.get('/fileupload', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getFileupload(req, res, id);
      });
    });
    //post handle upload file
    app.post('/fileupload', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postFileUpload(req, res, id);
      });
    });
    //post handle delete user mail notification file
    app.post('/delnotifile', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        delNotiFile(req, res, id);
      });
    });
    //post handle browse drive
    app.post('/browsedrive', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        console.log('browse drive');
        let newDrive = req.body.path;
        //Check the client path request if it is within the default drive path
        //****if (newDrive.toUpperCase().includes("D:/DRIVE/")) newDrive = drive.substring(0,drive.length-1);
        //****if (newDrive.toUpperCase().includes(drive.toUpperCase().substring(0,drive.length-1))) {
        if ((!newDrive.toUpperCase().includes('D:/DRIVE')) && (!newDrive.toUpperCase().includes(drive.toUpperCase()))) return res.json(JSON.stringify([]));
        if (newDrive.toUpperCase().includes('D:/DRIVE')) { //get the subpath from the default drive
          let drivePre = newDrive.substring(0,8);
          newDrive = newDrive.replace(drivePre,drive.substring(0,drive.length-1));
        }
        //Get directories and all files except temp and index files
        let disFiles = utilsdocms.getFiles(newDrive); let arrFiles = [];
        disFiles.forEach((item, i) => {
          if ((!item.includes('~')) && (!item.includes('.idxI')) && (!item.includes('.idxD'))) arrFiles.push(item);
        });
        var arrBr = {
          dirs:utilsdocms.getDirs(newDrive),
          files:arrFiles
        }
        res.json(JSON.stringify(arrBr));
        //}
      });
    });
    //
    //------------------------------------------FUNCTIONS START HERE----------------------------------------------------
    //process post explorer show file function
    function postExplorerShow(req, res, id){
      console.log('Show File Explorer');
      var disDrive = '/drive/';
      let newDrive = req.body.path;
      if (newDrive.toUpperCase().includes('D:/DRIVE')){
        let drivePre = newDrive.substring(0,8);
        newDrive = newDrive.replace(drivePre,drive.substring(0,drive.length-1));
      }
      var disFile = req.body.file; var disPath= newDrive;
      dbhandle.docFind(disPath+disFile, async function (found){
        //get document metadata
        rout= "";ref = [];enc = []; disClas = ""; disTag = []; disComm = [];disAuthor="";disDeyt="";disSize=0;
        if (found){
          disComm= found.comment;disAuthor=found.author;disDeyt=found.deyt;disSize=found.size; rout= found.routeslip;ref = found.reference;enc = found.enclosure; disClas = found.category; disTag = found.projects;
        }

        //copy file to temp path for preview
        if (fs.existsSync(disPath+disFile)){
          if (dochandle.getExtension(disFile)!='.pdf'){
            if (fs.existsSync(drivetmp + 'PDF-temp/'+ disFile +'.pdf')) fs.unlinkSync(drivetmp + 'PDF-temp/'+ disFile +'.pdf');
            dochandle.convDoctoPDF(disPath+disFile, drivetmp + 'PDF-temp/'+ disFile +'.pdf', function() { //convert doc to pdf
              let arrBr = [{tempPath: disDrive + 'PDF-temp/'+ disFile +'.pdf', disComm:disComm, disAuthor:disAuthor, disDeyt:disDeyt, disSize:disSize, realpath:disPath,disp:disFile, rout:rout, ref:ref, enc:enc, disClas:disClas, disTag:disTag}];
              res.json(JSON.stringify(arrBr)); //return metadata
            });
          } else {
            fs.copyFile(disPath+disFile, drivetmp + 'PDF-temp/'+ disFile, function(err) {
              if (err) console.log(err);
              let arrBr = [{tempPath: disDrive + 'PDF-temp/'+ disFile, disComm:disComm, disAuthor:disAuthor, disDeyt:disDeyt, disSize:disSize, realpath:disPath,disp:disFile, rout:rout, ref:ref, enc:enc, disClas:disClas, disTag:disTag}];
              res.json(JSON.stringify(arrBr)); //return metadata
            });
          }
        }

      });
    }

    //Process get Explorer Function
    function getExplorer(req, res, id){
      //refresh lists
      console.log('Get Explorer');
      dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
      dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
      dbhandle.userFind(id, function(user){
        dbhandle.groupFind(user.group, function (groups){
          fs.readdir(drivetmp + user.group, function(err,items){
            let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
            if (err) console.log(err);var def="empty";
            var disDrive = '/drive/';rout= "";ref = [];enc = []; disComm = [];
            if (sortArr.length > 0) {def=sortArr[0];}
            res.render('explorer', {layout:'layout-browse', realdrive:drive, level:user.level, mailfiles:user.mailfiles, docPers:groups, path:disDrive +'No Pending Files.pdf', files:sortArr, disp:"Empty File", branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc, disComm:disComm });
          });
        });
      });
    }
    //handle edit incoming documents
    function editincoming(req,res,id){
      dbhandle.userFind(id, function (user){
        let filepath = drivetmp+user.group+'/'+req.body.file;
        monitoring.getOriginator(req.body.file, function(branch){
          if (branch.toUpperCase() == user.group.toUpperCase()) { //if the requesting client is the originator of the doc
            dbhandle.actlogsCreate(id, Date.now(), 'Edit document during routing', req.body.file, req.ip);
            if (!fs.existsSync(drive+'Recoverhere/')) fs.mkdirSync(drive+'Recoverhere/');
            if (!fs.existsSync(drive+'Recoverhere/'+user.group.toUpperCase())) fs.mkdirSync(drive+'Recoverhere/'+user.group.toUpperCase());
            fs.copyFileSync(path.resolve(filepath),drive+'Recoverhere/'+user.group.toUpperCase()+'/'+req.body.file);
            res.json(user.path+'Recoverhere/'+user.group.toUpperCase()+'/'+req.body.file);
          } else res.json('notowner');

        });
        console.log('edit incoming document');
      });
    }
    //handle return released documents to the originating branch
    function returnrelease(req,res,id){
      dbhandle.userFind(id, function (user){
        let filepath = drivetmp+'Release/';
        if (fs.existsSync(path.resolve(filepath +req.body.fileroute))) {
            monitoring.getOriginator(req.body.fileroute, function(branch) {
              //ensure to return the document to appropriate branch....transfer to incoming-temp if no originator
              if ((branch.toUpperCase()==user.group.toUpperCase()) || (branch.toUpperCase()=='ALL BRANCHES') || (branch.trim()=='')) branch = "incoming-temp";
              dbhandle.actlogsCreate(id, Date.now(), 'Return Document to Branch: ' + branch.toString(), req.body.fileroute, req.ip);
              routeduty.routNoRefEnc(req,res, drivetmp + "Release/", drivetmp + branch + '/');
              monitoring.addRouteOnly(req.body.fileroute, branch, path.resolve(drivetmp));
              res.json('success');
            });
          } else res.json('fail');
        });
        console.log('return released document to the originator');
    }
    //handle delete documents
    function deletedoc(req,res,id){
      dbhandle.userFind(req.body.user, function (user){
        var filepath = "";
        if (req.body.branch=="fileopen") filepath = req.body.filepath;
        else {
          if (req.body.branch.toUpperCase()=="RELEASE") filepath= drivetmp+'Release/'+req.body.filepath;
          else if (req.body.branch.toUpperCase()=="INCOMING-TEMP") filepath= drivetmp+'incoming-temp/'+req.body.filepath;
          else filepath= drivetmp+req.body.branch+'/'+req.body.filepath;
        }
        //console.log(filepath);
        if (req.body.branch!="fileopen") { //if routing....the document is in the web temp folder
          monitoring.getOriginator(req.body.filename, function(branch){
            monitoring.findLastBranch(req.body.filename, user.group, function(found){ //check if current group is not the last branch routed
              //console.log(branch.toUpperCase() + req.body.branch.toUpperCase());
              if (!found)  { //if not the last branch
                if (branch.toString().toUpperCase().includes(user.group.toUpperCase())) { //if originator
                  dbhandle.monitorFindTitle(req.body.filename, function(result){ //delete in monitoring
                    if (result) dbhandle.monitorDel(result.filename, function(){});
                  });
                }
                dbhandle.docFind(filepath, function(docres){ //delete in pndocs
                  if (docres) dbhandle.docDel(filepath,()=>{});
                });
                //transfer to recovery folder
                if (fs.existsSync(filepath)){
                  if (!fs.existsSync(drive+'Recoverhere/')) fs.mkdirSync(drive+'Recoverhere/');
                  fs.copyFileSync(filepath,drive+'Recoverhere/'+req.body.filename)
                  fs.unlink(filepath, (err)=>{if (err) console.log(err);});
                }
                res.json('successful'); //respond to client
                //if the secretary/ receiving deletes the document within the web temp folder...emove file from monitoring and temp monitoring
                if (req.body.branch.toUpperCase()=="RELEASE")  {
                  dbhandle.actlogsCreate(id, Date.now(), 'Released document deleted', req.body.filename, req.ip);
                  dbhandle.monitorFindTitle(req.body.filename, (result)=>{ //remove from the monitoring
                    if (result) dbhandle.monitorDel(result.filename,()=>{});
                  });
                  //backup this monitoring record
                  dbhandle.tempmonitorFindFile(req.body.filename, function(tempresult){
                    if (tempresult) dbhandle.tempmonitorDel(req.body.filename,()=>{});
                  });
                } else dbhandle.actlogsCreate(id, Date.now(), 'Delete document during routing - branch for info', req.body.filename, req.ip);
              } else { //if part of of the routing
                if (branch.toString().toUpperCase().includes(user.group.toUpperCase())) { //if originator
                  dbhandle.monitorFindTitle(req.body.filename, function(result){ //delete in monitoring
                    if (result) dbhandle.monitorDel(result.filename, function(){});
                  });
                  dbhandle.docFind(filepath, function(docres){ //delete in pndocs
                    if (docres) dbhandle.docDel(filepath,()=>{});
                  });
                  //transfer to recovery folder
                  if (fs.existsSync(filepath)){
                    if (!fs.existsSync(drive+'Recoverhere/')) fs.mkdirSync(drive+'Recoverhere/');
                    fs.copyFileSync(filepath,drive+'Recoverhere/'+req.body.filename)
                    fs.unlink(filepath, (err)=>{if (err) console.log(err);});
                  }
                  res.json('successful');
                  dbhandle.actlogsCreate(id, Date.now(), 'Delete document during routing - branch routed', req.body.filename, req.ip);
                } else res.json('lastbranch');
              }

            });
          });
        } else { //if document is in the drive (file server)
          dbhandle.docFind(filepath, function(docres){ //delete in pndocs
            if (docres) dbhandle.docDel(filepath,()=>{});
          });
          if (fs.existsSync(filepath)){
            if (!fs.existsSync(drive+'Recoverhere/')) fs.mkdirSync(drive+'Recoverhere/');
            fs.copyFileSync(filepath,drive+'Recoverhere/'+req.body.filename)
            fs.unlink(filepath, (err)=>{if (err) console.log(err);});
          }
          res.json('successful');
          dbhandle.actlogsCreate(id, Date.now(), 'Delete document from the File Server', req.body.filename, req.ip);
        }
        console.log('deleting document');
      });
    }
    //handle save metadata on file open
    function savemetadoc(req,res,id){
      dbhandle.userFind(req.body.user, function (user){
          dbhandle.docFind(req.body.path+req.body.fileroute, function(docres){
            var arrRef = JSON.parse(req.body.refs); newRef = [];
            arrRef.forEach(function (ref){
              if (ref.path.substring(ref.path.length-1)=="/") newRef.push(ref.path+ref.file);
              else newRef.push(ref.path+'/'+ref.file);
            });
            var arrEnc = JSON.parse(req.body.encs); newEnc = [];
            arrEnc.forEach(function (enc){
              if (enc.path.substring(enc.path.length-1)=="/") newEnc.push(enc.path+enc.file);
              else newEnc.push(enc.path+'/'+enc.file);
            });
            var arrComment = JSON.parse(req.body.comments); newComm = [];
            arrComment.forEach(function (comment){
              newComm.push({branch:comment.branch, content:comment.content});
            });
            //check if document no record from DB
            if (!docres){
              var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
              utilsdocms.makeDir(drive + 'Routing Slip/',year, month);
              getcontent.getContent(req.body.path + req.body.fileroute,req.body.fileroute,function (discontent){
                //console.log(req.body.fileroute+':'+req.body.newfile);
                if (fs.existsSync(drivetmp + 'PDF-temp/route-'+ req.body.fileroute +'.pdf')) fs.copyFileSync(drivetmp + 'PDF-temp/route-'+ req.body.fileroute +'.pdf',drive+'Routing Slip/'+year+'/'+month+'/'+'route-'+req.body.fileroute+'.pdf');
                var routslipTemp = drive+'Routing Slip/'+year+'/'+month+'/'+'route-'+req.body.fileroute+'.pdf';
                discontent = discontent.substring(0,2000);
                dbhandle.docCreate (utilsdocms.generateID(), req.body.fileroute, req.body.path+req.body.fileroute, req.body.class, req.body.user, JSON.parse(req.body.tag), Date.now().toString(), fs.statSync(req.body.path + req.body.fileroute).size, discontent, routslipTemp, newRef, newEnc, newComm);
                res.json('successful');
              });
            } else  {
              dbhandle.docUpdateMeta(req.body.path+req.body.fileroute, req.body.class, JSON.parse(req.body.tag), newRef, newEnc, newComm);
              res.json('successful');
            }
          });

        console.log('Save Metadata document on file open');
      });
    }
    //handle save metadata on file open
    function savemetatofile(req,res,id){
      dbhandle.userFind(req.body.user, function (user){
          dbhandle.docFind(drivetmp +'Release/'+req.body.fileroute, function(docres){
            if (docres){
              utilsdocms.savemetatofile(req.body.fileroute, docres.reference, docres.enclosure, docres.comment, (retStr) => {
                res.json(retStr);
              })
            } else  {
              utilsdocms.savemetatofile(req.body.fileroute, [], [], [], (retStr) => {
                res.json(retStr);
              });
            }
            dbhandle.monitorFindTitle(req.body.fileroute, (result)=>{ //delete from monitoring
              if (result) dbhandle.monitorDel(result.filename,()=>{});
            });
          });

        console.log('Save Metadata to file');
      });
    }
    //handle file download
    function downloadfile(req, res, id){
      console.log('download file');
      var decode = Buffer.from(req.params.file,'base64').toString('ascii');
      var decodeBr = Buffer.from(req.params.view,'base64').toString('ascii');
      if (decodeBr == 'fileopen'){
        if (fs.existsSync(decode)) res.download(decode);
      } else {
        //console.log(decodeBr);
        if (decodeBr=="INCOMING-TEMP") decodeBr = "incoming-temp";
        res.download(path.resolve(drivetmp+decodeBr+'/'+decode));
      }
      dbhandle.actlogsCreate(id, Date.now(), 'File downloaded by the user', decode, req.ip);
    }

    //process delete user mail notification file
    function delNotiFile(req, res, id){
      console.log('Delete file from user notification');
      dbhandle.userFind(req.body.user, function (user){
        //console.log(found);
        if (user){
          arrFiles = user.mailfiles.filter(function(res){return res!=req.body.path});
          dbhandle.userUpdate(user.userN, user.hashP, user.email, user.salt, user.group, user.level, user.path, arrFiles, function(){
            res.json(JSON.stringify(arrFiles));
            let disFile = req.body.path.split('/');
            dbhandle.actlogsCreate(id, Date.now(), 'delete file from User Mail', disFile[disFile.length-1], req.ip);
          });
        } else res.json('notfound');
      });
    }
    //Process post file upload function
    function postFileUpload(req, res, id){
      console.log("uploading file");
      upload(req, res, function(err){
        if (err) res.json('error');
        else {
          utilsdocms.sleep(2000).then(()=>{
            if (req.cookies.fileAI.trim()!=''){
              console.log(path.resolve(drivetmp +'Uploads/' + req.cookies.fileAI.trim()));
              if (fs.existsSync(path.resolve(drivetmp +'Uploads/' + req.cookies.fileAI.trim()))) {
                if (req.cookies.realpath.toUpperCase().includes(drive.toUpperCase())){
                  fs.copyFileSync(drivetmp +'Uploads/' + req.cookies.fileAI.trim(), req.cookies.realpath + req.cookies.fileAI.trim());
                  fs.unlinkSync(drivetmp +'Uploads/' + req.cookies.fileAI.trim());
                  res.json('successful');
                  dbhandle.actlogsCreate(id, Date.now(), 'Upload File', req.cookies.fileAI.trim(), req.ip);
                } else res.json('error');
              } else res.json('error');
            } else res.json('error');
          })
        }
      });
    }
    //Process get file upload function
    function getFileupload(req, res, id){
      //refresh lists
      dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
      dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
      dbhandle.userFind(id, function(user){
        dbhandle.groupFind(user.group, function (groups){
          fs.readdir(drivetmp + user.group, function(err,items){
            let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
            if (err) console.log(err);var def="empty";
            var disDrive = '/drive/';rout= "";ref = [];enc = []; disComm = [];
            if (sortArr.length > 0) {def=sortArr[0];} uploadDrive = drive.substring(0,drive.length-1) + '/' + user.group;
            res.render('uploadfile', {layout:'layout-user', realdrive:drive, level:user.level, mailfiles:user.mailfiles, docPers:groups, path:uploadDrive, files:sortArr, disp:"Empty File", branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc, disComm:disComm });
          });
        });
      });
    }

    //process show file attachment Function
    function showFile(req, res, id){
      dbhandle.userFind(id, function(user){
        var disDrive = '/drive/';
        //remove the default 'd:/drive' string if used as the default drive
        let newDrive = req.body.path;
        if (newDrive.toUpperCase().includes('D:/DRIVE')) {
          let drivePre = newDrive.substring(0,8);
          newDrive = newDrive.replace(drivePre,drive.substring(0,drive.length-1));
        }
        let signRes = []; //initialize sign information
        var disFile = req.body.file; var disPath= newDrive;
        if (fs.existsSync(disPath+disFile)) { //if file is found
          if (dochandle.getExtension(disFile)!='.pdf'){ //if not pdf file the return file path to client with no signature info
            dochandle.convDoctoPDF(disPath+disFile, drivetmp + 'PDF-temp/'+ disFile +'.pdf', function(){
              var arrBr = disDrive + 'PDF-temp/'+ disFile +'.pdf';
              res.json(JSON.stringify({filepath:arrBr, level:user.level, signRes:signRes}));
            });
          } else { //if pdf file then validate digital certificate and return filepath
            signRes = utilsdocms.verifySign(disPath+disFile);
            if (JSON.stringify(signRes)!='[]') { if ((!signRes.message.includes("signed")) && (!signRes.message.includes("Multiple Signature")))  signRes = [];} //if error on validation
            fs.copyFile(disPath+disFile, drivetmp + 'PDF-temp/'+ disFile, function(err) {
              if (err) console.log(err);
              var arrBr = disDrive + 'PDF-temp/'+ disFile;
              res.json(JSON.stringify({filepath:arrBr, level:user.level, signRes:signRes}));
            });
          }
        } else res.json(JSON.stringify({filepath:'', level:user.level, signRes:[]}));

      });
    }
    //process post file open function
    function postFileopen(req, res, id){
      console.log('file open');
      dbhandle.userFind(id, function(user){
        fs.readdir(drivetmp + user.group, function(err,items){
          let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
          if (err) console.log(err);var def="empty";
          if (sortArr.length > 0) {def=sortArr[0];} var disDrive = '/drive/';
          let newDrive = req.body.path;
          if (newDrive.toUpperCase().includes('D:/DRIVE')){
            let drivePre = newDrive.substring(0,8);
            newDrive = newDrive.replace(drivePre,drive.substring(0,drive.length-1));
          }
          var disFile = req.body.file; var disPath= newDrive;
          dbhandle.docFind(disPath+disFile, async function (found){
            rout= "";ref = [];enc = []; disClas = []; disTag = []; disComm = [];
            if (found){
              disComm= found.comment; rout= found.routeslip;ref = found.reference;enc = found.enclosure; disClas = found.category; disTag = found.projects;
            }
            dbhandle.monitorFindTitle(disFile, (file)=>{
              utilsdocms.resolveRoutingSlip(found, disFile);
              if (fs.existsSync(disPath+disFile)) { //if file exists
                if (dochandle.getExtension(disFile)!='.pdf') { //if file is not pdf the convert doc
                  if (fs.existsSync(drivetmp + 'PDF-temp/'+ disFile +'.pdf')) fs.unlinkSync(drivetmp + 'PDF-temp/'+ disFile +'.pdf');
                  dochandle.convDoctoPDF(disPath+disFile, drivetmp + 'PDF-temp/'+ disFile +'.pdf', function(){
                    var arrBr = [{disComm:disComm, openpath:user.path, realpath:disPath, path:disDrive + 'PDF-temp/'+ disFile +'.pdf',files:sortArr,disp:disFile,branch:user.group,docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc, disClas:disClas, disTag:disTag}];
                    res.json(JSON.stringify(arrBr));
                  });
                }else { //if file is a PDF
                  fs.copyFile(disPath+disFile, drivetmp + 'PDF-temp/'+ disFile, function(err) {
                    if (err) console.log(err);
                    let signRes = utilsdocms.verifySign(drivetmp + 'PDF-temp/'+ disFile);
                    if (JSON.stringify(signRes)!='[]') { if ((!signRes.message.includes("signed")) && (!signRes.message.includes("Multiple Signature"))) signRes = [];} //if error on validation
                    var arrBr = [{signres:signRes, disComm:disComm, openpath:user.path, realpath:disPath, path:disDrive + 'PDF-temp/'+ disFile,files:sortArr,disp:disFile,branch:user.group,docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc, disClas:disClas, disTag:disTag}];
                    res.json(JSON.stringify(arrBr));
                  });
                }
                dbhandle.actlogsCreate(id, Date.now(), 'Open file from the File Server', req.body.file, req.ip);
              }else {
                res.json(JSON.stringify('notfound'));
              }
            });
          });
        });
      });
    }
    //Process get file open function
    function getFileopen(req, res, id){
      //refresh lists
      dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
      dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
      dbhandle.userFind(id, function(user){
        dbhandle.groupFind(user.group, function (groups){
          fs.readdir(drivetmp + user.group, function(err,items){
            let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
            if (err) console.log(err);var def="empty";
            var disDrive = '/drive/';rout= "";ref = [];enc = []; disComm = [];
            if (sortArr.length > 0) {def=sortArr[0];}
            res.render('openfile', {layout:'layout-user', realdrive:drive, level:user.level, mailfiles:user.mailfiles, docPers:groups, path:disDrive +'No Pending Files.pdf', files:sortArr, disp:"Empty File", branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc, disComm:disComm });
          });
        });
      });
    }
  });


};
