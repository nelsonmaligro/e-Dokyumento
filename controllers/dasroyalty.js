/*
Controller Module for the Managers and Bosses - Priveleged Transactions
- handles all document operations specifically for Managers, Asst. Managers, and other privileged transactions.
- It includes signing, annotations, and releasing of documents

@module Royalty
@author Nelson Maligro
@copyright 2020
@license GPL
*/
module.exports = function(app, arrDB){
  var fs = require('fs');
  var path = require('path');
  var bodyParser = require('body-parser');
  const cookieParser = require('cookie-parser');
  var routeduty = require('./routeduty');
  const dbhandle = require('./dbhandle');
  const dochandle = require('./dochandle');
  const monitoring = require('./monitoring');
  const pdflib = require('./pdflib');
  const utilsdocms = require('./utilsdocms');
  const dateformat = require('dateformat');
  var multer = require('multer');

  const PDFDocument = require('pdfkit');
  const nodesign = require('node-pdfsign');
  //initialize url encoding, cookies, and default drive path
  app.use(cookieParser());
  var urlencodedParser = bodyParser.urlencoded({extended:true});
  var drivetmp = "public/drive/", drive = "D:/Drive/", publicstr = 'public';
  //list all branches
  var docBr = [];
  dbhandle.generateList(arrDB.branch, function (res){ docBr = res; });
  dbhandle.settingDis((setting)=>{drivetmp = setting.publicdrive;});
  dbhandle.settingDis((setting)=>{publicstr = setting.publicstr;});
  dbhandle.settingDis((setting)=>{
    drive = setting.maindrive;
    //initialize file upload storage
    var storage =   multer.diskStorage({
      destination: function (req, file, callback) { callback(null, drivetmp +'Uploads/'); },
      filename: function (req, file, callback) { callback(null, file.originalname);}
    });
    var upload = multer({ storage : storage}).single('image');
    const signer = new nodesign.SignPdf;
    const {pdfkitAddPlaceholder, extractSignature, plainAddPlaceholder} = require ('./dist/helpers');

    //
    //---------------------------------- Express app handling starts here --------------------------------------------------
    //get handle signing document
    app.get('/signpdf', function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        getsignpdf(req, res, id);
      });
    });
    //post handle signing document
    app.post('/signpdf', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postsignpdf(req, res, id);
      });
    });
    //post handle annotating document
    app.post('/drawpdf', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        postdrawpdf(req, res, id);
      });
    });
    //post handle releasing document
    app.post('/releasedoc', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        releasesignpdf(req, res, id);
      });
    });
    //post handle cancel signing
    app.post('/cancelsign', urlencodedParser, function(req,res){
      utilsdocms.validToken(req, res,  function (decoded, id){
        if (fs.existsSync(drivetmp + 'PDF-temp/'+id+'.res.pdf')) fs.unlink(drivetmp + 'PDF-temp/'+id+'.res.pdf',()=>{res.json('ok');});
        else res.json('ok');
      });
    });
    //
    //------------------------------------------FUNCTIONS START HERE----------------------------------------------------

    //process document release after signing
    function releasesignpdf(req, res, id){
      dbhandle.userFind(id, function(user){
        utilsdocms.validateQRPass(req.body.user,req.body.hashval, function (result){
          if (result) {
            console.log('Release Document');
            var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
            pdflib.mergePDF(publicstr+req.body.filepath, drivetmp+'PDF-temp/'+req.body.fileroute+'.'+req.body.user+'.pdf', drivetmp+'PDF-temp/'+req.body.user+'.res.pdf', parseInt(req.body.num,10), () =>{
              new Promise ((resolve,reject)=>{
                if (fs.existsSync(drive+user.group+'/Signature/' + id +'.cert.p12')) {
                  let p12Buffer = fs.readFileSync(drive+user.group+'/Signature/' + id +'.cert.p12');
                  //fs.copyFileSync(drivetmp+'PDF-temp/' + disNewFile, disNewFile + '.sign.pdf');
                  dochandle.convDoctoPDF(drivetmp+'PDF-temp/'+req.body.fileroute+'.'+req.body.user+'.pdf', drivetmp+'PDF-temp/'+req.body.fileroute+'.'+req.body.user+'.pdf' + '.sign.pdf', function(){
                    let pdfBuffer = fs.readFileSync(drivetmp+'PDF-temp/'+req.body.fileroute+'.'+req.body.user+'.pdf' + '.sign.pdf');
                    pdfBuffer = plainAddPlaceholder({ pdfBuffer, reason: 'I approved and signed this document.', signatureLength: 1612,});
                    //let buf64 = Buffer.from(req.body.crtx, 'base64')
                    let buf64 = fs.readFileSync(drive+user.group+'/Signature/' + id +'.cert.psk',"utf8");
                    buf64 = Buffer.from(buf64, 'base64');
                    try {
                      pdfBuffer = signer.sign(pdfBuffer, p12Buffer, {passphrase:buf64.toString("utf8")},);
                      fs.writeFileSync(drivetmp+'PDF-temp/'+req.body.fileroute+'.'+req.body.user+'.pdf'+'.new.sign.pdf', pdfBuffer);
                      fs.copyFileSync(drivetmp+'PDF-temp/'+req.body.fileroute+'.'+req.body.user+'.pdf' + '.new.sign.pdf', drivetmp+'PDF-temp/'+req.body.fileroute+'.'+req.body.user+'.pdf'); //make a copy to drive folder
                      resolve();
                    } catch {resolve();}

                  });
                } else resolve();

              }).then(()=>{
                //ensure folders exists
                if (!fs.existsSync(drive+user.group)) fs.mkdirSync(drive+user.group);
                if (!fs.existsSync(drive+user.group+'/Released')) fs.mkdirSync(drive+user.group+'/Released');
                utilsdocms.makeDir(drive+user.group+'/Released/', year, month);
                //copy signed PDF from temp to next branch
                let dstFile = req.body.fileroute, monitBranch = 'GM';
                if (fs.existsSync(drivetmp+'PDF-temp/'+req.body.user+'.res.pdf')) { //if document is signed (with .res.pdf extension)
                  if (fs.existsSync(drivetmp+'PDF-temp/'+req.body.fileroute+'.'+req.body.user+'.pdf')){
                    fs.copyFileSync(drivetmp+'PDF-temp/'+req.body.fileroute+'.'+req.body.user+'.pdf', drive+user.group+'/Released/'+year+'/'+month+'/'+req.body.fileroute+'.pdf'); //make a copy to drive folder
                    if (fs.existsSync(drivetmp+'PDF-temp/'+req.body.user+'.res.pdf')) fs.unlinkSync(drivetmp+'PDF-temp/'+req.body.user+'.res.pdf');
                  }
                  if (dochandle.getExtension(req.body.fileroute)!='.pdf') dstFile = req.body.fileroute+'.pdf';
                  if (req.body.branch=='Originator'){ //back to the originator
                    monitoring.getOriginator(req.body.fileroute, function(branch){
                      monitBranch = branch;
                      if ((branch.toUpperCase()==user.group.toUpperCase()) || (branch.trim()=='')) monitBranch='incoming-temp'; //if no originator
                      routeduty.routRoyal(req,res,drivetmp+'PDF-temp/'+req.body.fileroute+'.'+req.body.user+'.pdf', drivetmp + monitBranch + '/'+ dstFile, dstFile, drivetmp+user.group+'/'+req.body.fileroute);
                    });
                  } else if (req.body.branch=='Boss') {// to GM/Top Management
                    dbhandle.settingDis((setting)=>{
                      monitBranch = setting.topmgmt;
                      routeduty.routRoyal(req,res,drivetmp+'PDF-temp/'+req.body.fileroute+'.'+req.body.user+'.pdf', drivetmp + setting.topmgmt + '/'+ dstFile, dstFile, drivetmp+user.group+'/'+req.body.fileroute);
                    });
                  } else { //to Secretatary/ Receiving
                    monitBranch = req.body.branch;
                    routeduty.routRoyal(req,res,drivetmp+'PDF-temp/'+req.body.fileroute+'.'+req.body.user+'.pdf', drivetmp + req.body.branch + '/'+ dstFile, dstFile, drivetmp+user.group+'/'+req.body.fileroute);
                  }
                } else { //if document is not signed
                  if (req.body.branch=='Boss'){
                    dbhandle.settingDis((setting)=>{
                      monitBranch = setting.topmgmt;
                      routeduty.routRoyal(req,res,drivetmp+user.group+'/'+req.body.fileroute, drivetmp + setting.topmgmt + '/' + req.body.fileroute, req.body.fileroute, drivetmp+user.group+'/'+req.body.fileroute);
                    });
                  } else routeduty.routRoyal(req,res,drivetmp+user.group+'/'+req.body.fileroute, drivetmp + req.body.branch + '/' + req.body.fileroute, req.body.fileroute, drivetmp+user.group+'/'+req.body.fileroute);
                }
                //Update document monitoring
                dbhandle.monitorFindTitle(req.body.fileroute, function(result){ //
                  if (result) {
                    deyt = dateformat(Date.now(),"dd mmm yyyy HH:MM");
                    dbhandle.actlogsCreate(id, Date.now(), 'Released signed document', req.body.fileroute, req.ip); //log released document
                    result.route.push({deyt:deyt,branch:monitBranch});
                    dbhandle.monitorAddRoute(dstFile, req.body.fileroute, result.route, path.resolve(drivetmp));
                    dbhandle.monitorUpdateFilename(req.body.fileroute, dstFile);
                  }
                });
              }).catch((err)=>{console.log(err);});
            });
          } else res.json('fail');
        });
      });
    }
    //process document signing post request
    function postsignpdf(req, res, id){
      dbhandle.userFind(id, function(user){
        console.log('Sign Document');
          pdflib.addSignMainDoc(user.group, id, publicstr+req.body.filepath, drivetmp+'PDF-temp/'+req.body.user+'.res.pdf', req.body.disX, req.body.disY, req.body.nodate, req.body.width, req.body.height, () =>{
          res.json('successful');
        });
      });
    }
    //process document signing post request
    function postdrawpdf(req, res, id){
      dbhandle.userFind(id, function(user){
        console.log('Draw Line to Document');
        upload(req, res, function(err){
          if (err) res.json('error');
          else {
            utilsdocms.sleep(2000).then(()=>{
              if (fs.existsSync(path.resolve(drivetmp +'Uploads/' + id + '.drw.png'))) {
                fs.readFile(drivetmp +'Uploads/' + id + '.drw.png', 'utf-8', (err, data) => {
                  base64Data = data.replace(/^data:image\/png;base64,/, "");
                  let buff = new Buffer.from(base64Data,'base64');
                  fs.writeFile(drivetmp +'PDF-temp/' + id + '.new.drw.png',  buff, (err)=>{
                    pdflib.addLineDoc(user.group, id, publicstr+req.cookies.fileOpn, drivetmp+'PDF-temp/', () =>{
                      res.json('successful');
                      dbhandle.actlogsCreate(id, Date.now(), 'Upload File', req.cookies.fileAI.trim(), req.ip);
                    });
                  });
                });
              } else res.json('error');
            })
          }
        });
      });
    }
    //Process get incoming function
    function getsignpdf(req, res, id, boolFile){
      console.log('return pages to the signing PDF');
      pdflib.returnPage(publicstr+req.query.filepath, drivetmp+'PDF-temp/'+req.query.user+'.pdf',req.query.num,() =>{
        res.json('successful');
      });
    };
  });
};
