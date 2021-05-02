/*
Controller Module for File Operation
    - handles all file operations such as download, edit, delete, upload, open, and browsing of drive

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
    //post handle edit file within client incoming view
    app.post('/editincoming', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        editincoming(req, res, id);
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
            rout= "";ref = [];enc = []; disClas = ""; disTag = []; disComm = [];disAuthor="";disDeyt="";disSize=0;
            if (found){
              disComm= found.comment;disAuthor=found.author;disDeyt=found.deyt;disSize=found.size; rout= found.routeslip;ref = found.reference;enc = found.enclosure; disClas = found.category; disTag = found.projects;
            }
            var arrBr = [{disComm:disComm, disAuthor:disAuthor, disDeyt:disDeyt, disSize:disSize, realpath:disPath,disp:disFile, rout:rout, ref:ref, enc:enc, disClas:disClas, disTag:disTag}];
            res.json(JSON.stringify(arrBr));
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
    //handle delete documents
    function deletedoc(req,res,id){
      dbhandle.userFind(req.body.user, function (user){
        var filepath = "";
        if (req.body.branch=="fileopen") filepath = req.body.filepath;
        else {
          if (req.body.branch.toUpperCase()=="RELEASE") filepath= drivetmp+'Release/'+req.body.filepath;
          else filepath= drivetmp+req.body.branch+'/'+req.body.filepath;
        }
        //console.log(filepath);
        if (req.body.branch!="fileopen"){ //if routing
          monitoring.getOriginator(req.body.filename, function(branch){
            monitoring.findLastBranch(req.body.filename, user.group, function(found){
              //console.log(branch.toUpperCase() + req.body.branch.toUpperCase());
              if (!found)  { //All Branches - not part of routing
                if (branch.toString().toUpperCase().includes(user.group.toUpperCase())) { //if originator
                  dbhandle.monitorFindFile(req.body.filename, function(result){ //delete in monitoring
                    if (result) dbhandle.monitorDel(req.body.filename, function(){});
                  });
                }
                dbhandle.docFind(filepath, function(docres){ //delete in pndocs
                  if (docres) dbhandle.docDel(filepath,()=>{});
                });
                if (fs.existsSync(filepath)){
                  if (!fs.existsSync(drive+'Recoverhere/')) fs.mkdirSync(drive+'Recoverhere/');
                  fs.copyFileSync(filepath,drive+'Recoverhere/'+req.body.filename)
                  fs.unlink(filepath, (err)=>{if (err) console.log(err);});
                }
                res.json('successful');
                console.log(req.body.branch.toUpperCase());
                if (req.body.branch.toUpperCase()=="RELEASE")  { //remove file from monitoring and temp monitoring
                  dbhandle.actlogsCreate(id, Date.now(), 'Released document deleted', req.body.filename, req.ip);
                  dbhandle.monitorFindFile(req.body.filename, (result)=>{
                    if (result) dbhandle.monitorDel(result.filename,()=>{});
                  });
                  dbhandle.tempmonitorFindFile(req.body.filename, function(tempresult){
                    if (tempresult) dbhandle.tempmonitorDel(req.body.filename,()=>{});
                  });
                } else dbhandle.actlogsCreate(id, Date.now(), 'Delete document during routing - branch for info', req.body.filename, req.ip);
              } else { //part of routing
                if (branch.toString().toUpperCase().includes(user.group.toUpperCase())) { //if originator
                  dbhandle.monitorFindFile(req.body.filename, function(result){ //delete in monitoring
                    if (result) dbhandle.monitorDel(req.body.filename, function(){});
                  });
                  dbhandle.docFind(filepath, function(docres){ //delete in pndocs
                    if (docres) dbhandle.docDel(filepath,()=>{});
                  });
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
        } else {
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
    //handle file download
    function downloadfile(req, res, id){
      console.log('download file');
      var decode = Buffer.from(req.params.file,'base64').toString('ascii');
      var decodeBr = Buffer.from(req.params.view,'base64').toString('ascii');
      if (decodeBr == 'fileopen'){
        if (fs.existsSync(decode)) res.download(decode);
      } else res.download(path.resolve(drivetmp+decodeBr+'/'+decode));
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
        let newDrive = req.body.path;
        if (newDrive.toUpperCase().includes('D:/DRIVE')) {
          let drivePre = newDrive.substring(0,8);
          newDrive = newDrive.replace(drivePre,drive.substring(0,drive.length-1));
        }
        var disFile = req.body.file; var disPath= newDrive;
        if (dochandle.getExtension(disFile)!='.pdf'){
          dochandle.convDoctoPDF(disPath+disFile, drivetmp + 'PDF-temp/'+ disFile +'.pdf', function(){
            var arrBr = disDrive + 'PDF-temp/'+ disFile +'.pdf';
            res.json(JSON.stringify({filepath:arrBr, level:user.level}));
          });
        }else {
          fs.copyFile(disPath+disFile, drivetmp + 'PDF-temp/'+ disFile, function(err) {
            if (err) console.log(err);
            var arrBr = disDrive + 'PDF-temp/'+ disFile
            res.json(JSON.stringify({filepath:arrBr, level:user.level}));
          });
        }
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
            dbhandle.monitorFindFile(disFile, (file)=>{
              utilsdocms.resolveRoutingSlip(found, disFile);
              if (fs.existsSync(disPath+disFile)){
                if (dochandle.getExtension(disFile)!='.pdf'){
                  if (fs.existsSync(drivetmp + 'PDF-temp/'+ disFile +'.pdf')) fs.unlinkSync(drivetmp + 'PDF-temp/'+ disFile +'.pdf');
                  dochandle.convDoctoPDF(disPath+disFile, drivetmp + 'PDF-temp/'+ disFile +'.pdf', function(){
                    var arrBr = [{disComm:disComm, openpath:user.path, realpath:disPath, path:disDrive + 'PDF-temp/'+ disFile +'.pdf',files:sortArr,disp:disFile,branch:user.group,docClass:docClass, docTag:docTag, rout:rout, ref:ref, enc:enc, disClas:disClas, disTag:disTag}];
                    res.json(JSON.stringify(arrBr));
                  });
                }else {
                  fs.copyFile(disPath+disFile, drivetmp + 'PDF-temp/'+ disFile, function(err) {
                    if (err) console.log(err);
                    let signRes = utilsdocms.verifySign(drivetmp + 'PDF-temp/'+ disFile);
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
