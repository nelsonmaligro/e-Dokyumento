/*
Controller Module for System Administration

@module SysAdmin
@author Nelson Maligro
@copyright 2020
@license GPL
*/
module.exports = function(app, arrDB){
  var fs = require('fs');
  var path = require('path');
  var bodyParser = require('body-parser');
  const cookieParser = require('cookie-parser');
  const dbhandle = require('./dbhandle');
  const dochandle = require('./dochandle');
  const utilsdocms = require('./utilsdocms');
  const dateformat = require('dateformat');
  var multer = require('multer');
  //initialize url encoding, cookies, and default drive path
  app.use(cookieParser());
  var urlencodedParser = bodyParser.urlencoded({extended:true});
  var drivetmp = "public/drive/", drive = "D:/Drive/", publicstr = 'public';
  var cacertdrive = 'controllers/verify/helpers/CAcert/';
  dbhandle.settingDis((setting)=>{drivetmp = setting.publicdrive;});
  dbhandle.settingDis((setting)=>{publicstr = setting.publicstr;});

  //list all document classification and tags
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
    var avatar = multer({ storage : storage}).single('avatarinput');
    var pngimage = multer({ storage : storage}).single('pnginput');
    var svgimage = multer({ storage : storage}).single('svginput');
    var certfile = multer({ storage : storage}).single('certinput');
    var cacertfile = multer({ storage : storage}).single('cacertinput');
    //
    //---------------------------------- Express app handling starts here --------------------------------------------------
    //post handle switching user privilege from branch duty to office admin - not applicable for staff and secretary
    app.post('/switchduty', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        switchduty(req, res, id);
      });
    });
    //post upload avatar
    app.post('/avatarupload', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postavatarUpload(req, res, id);
      });
    });
    //post upload png signature
    app.post('/pngupload', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postpngUpload(req, res, id);
      });
    });
    //post upload svg signature
    app.post('/svgupload', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postsvgUpload(req, res, id);
      });
    });
    //post upload svg signature
    app.post('/certupload', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postcertUpload(req, res, id);
      });
    });
    //post upload svg signature
    app.post('/cacertupload', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postcacertUpload(req, res, id);
      });
    });
    //post handle registration of users
    app.post('/reguser', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        registeruser(req, res, id);
      });
    });
    //post handle updating of server settings
    app.post('/updateserver', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        updateserver(req, res, id);
      });
    });
    //get default view for system administration
    app.get('/kalikot', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getkalikot(req, res, id);
      });
    });
    //get display profile settings for all users
    app.get('/myprofile', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getmyprofile(req, res, id);
      });
    });
    //post update accounts
    app.post('/updateaccount', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postupdateaccount(req, res, id);
      });
    });
    //get handle show all users
    app.get('/viewusers', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        viewusers(req, res, id);
      });
    });
    //get handle show server settings
    app.get('/configserve/:view', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        configserve(req, res, id);
      });
    });
    //get handle show logs
    app.get('/showlogs/:view', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        showlogs(req, res, id);
      });
    });
    //
    //------------------------------------------FUNCTIONS START HERE----------------------------------------------------
    //process show logs
    function showlogs(req, res, id){
      dbhandle.userFind(id, function(user){
        if ((user.level.toUpperCase()==='SYSADMIN')) {
          if (req.params.view=='Signed Documents'){
            dbhandle.actlogFindAction('Sign document with e-signature',(result)=>{
              //console.log(result);
              return res.render('configserve', {layout:'layout-admin', show:req.params.view, setting:JSON.stringify(result),view:'logs', docBr:docBr, docClass:docClass, level:user.level, mailfiles:user.mailfiles});
            });
          } else if (req.params.view=='Released Documents'){
            dbhandle.actlogFindAction('Released document deleted',(result)=>{
              //console.log(result);
              return res.render('configserve', {layout:'layout-admin', show:req.params.view, setting:JSON.stringify(result),view:'logs', docBr:docBr, docClass:docClass, level:user.level, mailfiles:user.mailfiles});
            });
          } else return res.render('configserve', {layout:'layout-admin', show:req.params.view, setting:JSON.stringify([]),view:'logs', docBr:docBr, docClass:docClass, level:user.level, mailfiles:user.mailfiles});
        }
      });
    }
    //Process switch level
    function switchduty(req, res, id){
      console.log("switch duty");
      dbhandle.userFind(id, function(user){
        if (user.level.toUpperCase()=='DUTYBRANCH') {
          dbhandle.updateLevel(id,"DutyAdmin",()=>{
            res.json('successful');
            dbhandle.actlogsCreate(id, Date.now(), 'User toggled privilege to Duty Admin', 'none', req.ip);
          });
        } else if (user.level.toUpperCase()=='DUTYADMIN') {
          dbhandle.updateLevel(id,"DutyBranch",()=>{
            res.json('successful');
            dbhandle.actlogsCreate(id, Date.now(), 'User toggled privilege to Duty Branch', 'none', req.ip);
          });
        }
      });
    }
    //Process post avatar upload function
    function postavatarUpload(req, res, id){
      console.log("uploading avatar");
      avatar(req, res, function(err){
        if (err) res.json('error');
        else {
          if (fs.existsSync(drivetmp +'Uploads/' + req.cookies.fileAI)) {
            fs.copyFileSync(drivetmp +'Uploads/' + req.cookies.fileAI, publicstr+'/images/' + id +'.jpg')
            fs.unlinkSync(drivetmp +'Uploads/' + req.cookies.fileAI);
            res.json('successful');
            dbhandle.actlogsCreate(id, Date.now(), 'Upload profile picture', 'none', req.ip);
          }
        }
      });
    }
    //Process post png upload function
    function postpngUpload(req, res, id){
      console.log("uploading PNG image signature");
      pngimage(req, res, function(err){
        if (err) res.json('error');
        else {
          if (fs.existsSync(drivetmp +'Uploads/' + req.cookies.fileAI)) {
            dbhandle.userFind(id, function(user){
              if (!fs.existsSync(drive+user.group+'/Signature/')) fs.mkdirSync(drive+user.group+'/Signature');
              fs.copyFileSync(drivetmp +'Uploads/' + req.cookies.fileAI, drive+user.group+'/Signature/' + id +'.png')
              fs.unlinkSync(drivetmp +'Uploads/' + req.cookies.fileAI);
              res.json('successful');
              dbhandle.actlogsCreate(id, Date.now(), 'User upload PNG image for signature', 'none', req.ip);
            });
          }
        }
      });
    }
    //Process post png upload function
    function postsvgUpload(req, res, id){
      console.log("uploading SVG image signature");
      svgimage(req, res, function(err){
        if (err) res.json('error');
        else {
          if (fs.existsSync(drivetmp +'Uploads/' + req.cookies.fileAI)) {
            fs.copyFileSync(drivetmp +'Uploads/' + req.cookies.fileAI, publicstr+'/images/' + id +'.svg')
            fs.unlinkSync(drivetmp +'Uploads/' + req.cookies.fileAI);
            res.json('successful');
            dbhandle.actlogsCreate(id, Date.now(), 'User upload SVG image for signature', 'none', req.ip);
          }
        }
      });
    }
    //Process post certificate upload function
    function postcertUpload(req, res, id){
      console.log("uploading digital certificate signature");
      certfile(req, res, function(err){
        if (err) res.json('error');
        else {
          if (fs.existsSync(drivetmp +'Uploads/' + req.cookies.fileAI)) {
            dbhandle.userFind(id, function(user){
              if (!fs.existsSync(drive+user.group+'/Signature/')) fs.mkdirSync(drive+user.group+'/Signature');
              fs.copyFileSync(drivetmp +'Uploads/' + req.cookies.fileAI, drive+user.group+'/Signature/' + id +'.cert.p12')
              fs.unlinkSync(drivetmp +'Uploads/' + req.cookies.fileAI);
              fs.writeFileSync(drive+user.group+'/Signature/' + id +'.cert.psk',req.cookies.passCert);
              res.json('successful');
              dbhandle.actlogsCreate(id, Date.now(), 'User upload Digital Certificate for signature', 'none', req.ip);
            });
          }
        }
      });
    }
    //Process post certificate upload function
    function postcacertUpload(req, res, id){
      console.log("uploading Signing or Intermediate CA certificate");
      cacertfile(req, res, function(err){
        if (err) res.json('error');
        else {
          if (fs.existsSync(drivetmp +'Uploads/' + req.cookies.fileAI)) {
            dbhandle.userFind(id, function(user){
              fs.copyFileSync(drivetmp +'Uploads/' + req.cookies.fileAI, cacertdrive + req.cookies.fileAI + '.crt')
              fs.unlinkSync(drivetmp +'Uploads/' + req.cookies.fileAI);
              res.json('successful');
              dbhandle.actlogsCreate(id, Date.now(), 'Admin upload Signing CA Certificate for signature', 'none', req.ip);
            });
          }
        }
      });
    }
    //process update Profile
    function getmyprofile(req, res, id) {
      //refresh lists
      dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
      dbhandle.generateList(arrDB.tag, function (res){ docTag = res; });
      dbhandle.userFind(id, function(user){
        fs.readdir(drivetmp + user.group, function(err,items){
          if (err) console.log(err);var def="empty";
          let sortArr = utilsdocms.checkPermission(items, drivetmp + user.group + '/');
          if (sortArr.length > 0) {def=sortArr[0];} var disDrive = '/drive/';var disFile = def;
          if ((user.level.toUpperCase()==='DUTYADMIN') || (user.level.toUpperCase()==='SECRETARY')) {
            return res.render('myprofile', { layout:'layout-receive', realdrive:drive, fullname:user.email, level:user.level, release:[], branch:'incoming-temp', mailfiles:user.mailfiles, docPers:[], path:disDrive + 'PDF-temp/'+ disFile + '.pdf', files:sortArr, disp:disFile, docBr:docBr});
          } else if ((user.level.toUpperCase()==='DEP') || (user.level.toUpperCase()==='CO') || (user.level.toUpperCase()==='EAGM') || (user.level.toUpperCase()==='GM')) {
            return res.render('myprofile', {layout:'layout-royal', realdrive:drive, fullname:user.email, level:user.level, category:'none', mailfiles:user.mailfiles, docPers:[], path:disDrive + 'PDF-temp/'+ disFile +'.pdf', files:sortArr, disp:disFile, branch:user.group});
          } else {
            return res.render('myprofile', {layout:'layout-user', realdrive:drive, fullname:user.email, level:user.level, runscanai:'false', mailfiles:user.mailfiles, docPers:[], path:disDrive + 'PDF-temp/'+ disFile +'.pdf', files:sortArr, disp:disFile, branch:user.group, docBr:docBr, docClass:docClass, docTag:docTag});
          }
        });
      });
    }
    //process update user profile account
    function postupdateaccount(req, res, id){
      dbhandle.userFind(id, function(user){
        if (req.body.action=='saveqr') {
          console.log('Update Fullname');
          dbhandle.userQRUpdate(id, req.body.fullname,()=>{
            res.json('successful');
            dbhandle.actlogsCreate(id, Date.now(), 'Update Profile Fullname', 'none', req.ip);
          });
        }
        if (req.body.action=='savepass') {
          console.log('Update Fullname');
          dbhandle.userPassUpdate(id, req.body.hash,()=>{
            res.json('successful');
            dbhandle.actlogsCreate(id, Date.now(), 'Update Profile Password', 'none', req.ip);
          });
        }
      });
    }
    //process registration of users
    function updateserver(req, res, id){
      dbhandle.userFind(id, function(user){
        if (user.level.toUpperCase()=='SYSADMIN') {
          //Switch condition for action parameter
          switch (req.body.action){
            case 'retrainai':
              console.log('Retrain AI for Branch and Doc classification');
              utilsdocms.runPy('./AI/ClassBranch/docClas.py', '').then(function(dataBr){
                console.log(dataBr.toString());
                utilsdocms.runPy('./AI/ClassDoc/docClas.py', '').then(function(dataDoc){
                  console.log(dataDoc.toString());
                  res.json('successful');
                });
              });
              break;
            case 'editdrive':
              console.log('Update Drive Setting');
              dbhandle.settingUpdate(req.body.maindrive,req.body.publicdrive,req.body.publicstr, ()=>{
                res.json('successful');
                dbhandle.actlogsCreate(id, Date.now(), 'Update Drive Setting', 'none', req.ip);
              });
              break;
            case 'editAI':
              console.log('Update AI Setting');
              dbhandle.settingAIUpdate(req.body.ai, ()=>{
                res.json('successful');
                dbhandle.actlogsCreate(id, Date.now(), 'Update AI Setting', 'none', req.ip);
              });
              break;
              case 'edittopmgmt':
                console.log('Update Top Management Setting');
                dbhandle.settingmgmtUpdate(req.body.mgmt, ()=>{
                  res.json('successful');
                  dbhandle.actlogsCreate(id, Date.now(), 'Update Top Management Setting', 'none', req.ip);
                });
              break;
              case 'clearpdf':
                console.log('Clear PDF Folder');
                fs.readdir(drivetmp +'PDF-temp/', (err, files) => {
                  if (err) console.log(err);
                  for (const file of files) {
                    fs.unlink(path.join(drivetmp +'PDF-temp/', file), err => {
                      if (err) console.log(err);
                    });
                  }
                });
                res.json('successful');
                dbhandle.actlogsCreate(id, Date.now(), 'Clear PDF Folder', 'none', req.ip);
              break;
              case 'addgroup':
                console.log('Add Branch/ Group');
                dbhandle.addListCall(arrDB.branch,req.body.group, (success)=>{
                  if (success) {res.json('successful'); dbhandle.actlogsCreate(id, Date.now(), 'Add Branch/Group', 'none', req.ip); }
                  else res.json('fail');
                });
              break;
              case 'delgroup':
                console.log('Delete Branch/ Group');
                req.body.group.forEach((group, idx)=>{
                  dbhandle.delList(arrDB.branch, group, ()=>{
                    if (idx==req.body.group.length -1) {res.json('successful'); dbhandle.actlogsCreate(id, Date.now(), 'Delete Branch/Group', 'none', req.ip); }
                  });
                });
              break;
              case 'addclass':
                console.log('Add Classification');
                dbhandle.addListCall(arrDB.class,req.body.class, (success)=>{
                  if (success) {res.json('successful');dbhandle.actlogsCreate(id, Date.now(), 'Add Correspondence', 'none', req.ip);}
                  else res.json('fail');
                });
              break;
              case 'delclass':
                console.log('Delete Classification');
                req.body.class.forEach((disclass, idx)=>{
                  dbhandle.delList(arrDB.class, disclass, ()=>{
                    if (idx==req.body.class.length -1) {res.json('successful');dbhandle.actlogsCreate(id, Date.now(), 'Delete Correspondence', 'none', req.ip);}
                  });
                });
              break;
            default:
              res.json('fail');
              break;
          }
        } else res.json('fail');
      });
    }
    //process default page for System Admin
    function getkalikot(req, res, id){
      dbhandle.userFind(id, function(user){
        if ((user.level.toUpperCase()==='SYSADMIN')) {
          dbhandle.settingDis((setting)=>{
            let topmgmt = 'N6';
            if (setting.topmgmt) topmgmt = setting.topmgmt;
            return res.render('register', {layout:'layout-admin', topmgmt:topmgmt, docBr:docBr, level:user.level, mailfiles:user.mailfiles});
          })

        }
      });
    }
    //process page for server configuration
    function configserve(req, res, id){
      dbhandle.userFind(id, function(user){
        if ((user.level.toUpperCase()==='SYSADMIN')) {
          dbhandle.settingDis((setting)=>{
            dbhandle.generateList(arrDB.class, function (res){ docClass = res; });
            dbhandle.generateList(arrDB.branch, function (res){ docBr = res; });
            return res.render('configserve', {layout:'layout-admin', setting:JSON.stringify(setting),view:req.params.view, docBr:docBr, docClass:docClass, level:user.level, mailfiles:user.mailfiles});
          })
        }
      });
    }
    //process view all users
    function viewusers(req, res, id){
      dbhandle.userFind(id, function(user){
        if ((user.level.toUpperCase()==='SYSADMIN')) {
          dbhandle.genUsers(function(users){
            return res.render('tableusers', {layout:'layout-admin', users:JSON.stringify(users), docBr:docBr, level:user.level, mailfiles:user.mailfiles});
          });
        }
      });
    }
    //process registration of users
    function registeruser(req, res, id){
      dbhandle.userFind(id, function(user){
        if (user.level.toUpperCase()=='SYSADMIN') {
          //var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
          if (req.body.action=='register'){
            console.log('Register User Account');
            dbhandle.userFind(req.body.userN, function(found){
              if (!found){
                dbhandle.userCreate(req.body.userN, req.body.hashval, req.body.email, req.body.branch[0], req.body.access[0],req.body.drive,[]);
                res.json('successful');
                dbhandle.actlogsCreate(id, Date.now(), 'Add user account', 'none', req.ip);
              } else res.json('fail');
            });
          } else if (req.body.action=='edituser'){
            console.log('Edit User Account');
            dbhandle.userFind(req.body.userN, function(found){
              let oldPass = '';
              if (req.body.hashval!='') oldPass = req.body.hashval;
              dbhandle.userUpdPass(req.body.userN, oldPass, req.body.email, req.body.branch, req.body.level,req.body.drive,[]);
              res.json('successful');
              dbhandle.actlogsCreate(id, Date.now(), 'Edit user account', 'none', req.ip);
            });
          } else if (req.body.action=='deluser'){
            console.log('Delete User Account');
            dbhandle.userFind(req.body.userN, function(found){
              dbhandle.validatePassword(user.userN,req.body.hashval, function (result){
                if ((result) && (user.userN!=req.body.userN)) {
                  dbhandle.userDel(req.body.userN, function(){
                    res.json('successful');
                    dbhandle.actlogsCreate(id, Date.now(), 'Delete user account', 'none', req.ip);
                  });
                } else res.json('fail');
              });
            });
          }
        } else res.json('fail');
      });
    }
  });
};
