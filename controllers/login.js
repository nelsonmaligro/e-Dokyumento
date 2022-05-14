/*
Primary Controller - Handle client login

@module Login
@author Nelson Maligro
@copyright 2020
@license GPL
*/
module.exports = function(app){
  var bodyParser = require('body-parser');
  const qrcode = require('qrcode');
  const jwt = require('jsonwebtoken');
  const mongoose = require('mongoose');
  const passport = require('passport');
  var localStrategy = require('passport-local').Strategy;
  var path = require('path');
  var bodyParser = require('body-parser');
  var dbhandle = require('./dbhandle');
  const utilsdocms = require('./utilsdocms');
  const dateformat = require('dateformat');
  var fs = require('fs');
  const userModel = require('../models/accounts');
  const monitoring = require('./monitoring');
  var rateLimit = require('express-rate-limit');
  var daysexpire = 10;
  var drivetmp = "public/drive/", drive = "D:/Drive/", publicstr='public';
  var urlencodedParser = bodyParser.urlencoded({extended:true});

  dbhandle.settingDis((setting)=>{drivetmp = setting.publicdrive;});
  dbhandle.settingDis((setting)=>{publicstr = setting.publicstr;});

  dbhandle.settingDis((setting)=>{
    drive = setting.maindrive;
    //var urlencodedParser = bodyParser.urlencoded({extended:true});
    app.use(bodyParser.urlencoded({extended:true})) // parse application/x-www-form-urlencoded
    app.use(bodyParser.json()) // parse application/json

    app.use(passport.initialize());
    app.use(passport.session());
    // set up rate limiter: maximum of 5000 requests per minute
    var limiter =  rateLimit({
      windowMs: 1*60*1000, // 1 minute
      max: 5000
    });
    app.use(limiter);

    //test login for Android adapter
    app.get('/login-adapter', function(req, res){
      return res.render('login-adapter', {layout:'empty', error:'Valid'});
    });
    //Post login for Android adapter
    app.post('/login-adapter',  function(req,res, next) {
      dbhandle.userFind(req.body.username, function (user) {
        //console.log(req.body.user,req.body.hashval);
        if (user){
          passport.authenticate('login', {session:false}, function (err,passportuser,info){
            if (err) {res.json('error');}
            if (!passportuser) {
              console.log('Password Invalid');
              res.json('Password Invalid');
            } else if (passportuser) {
              const user = passportuser;
              user.token = passportuser.generateJWT();
              //console.log(user.toAuthJSON());
              //res.cookie('token', user.toAuthJSON());
              res.setHeader('token',JSON.stringify(user.toAuthJSON()));
              res.json('User Valid');
            }
          })(req,res,next);
        } else {
          console.log('user invalid');
          res.json('User Invalid');
        }
      });
    });

    //get verify documents QR Code
    app.get('/verifydoc', function(req, res){
      return res.render('verifydoc', {layout:'empty'});
    });
    //post incoming with params
    app.post('/', function(req,res, next) {
      passport.authenticate('login', {session:false}, function (err,passportuser,info){
        if (err) { console.log(err);return next(err); }
        if (!passportuser) {
          console.log('Login Failed');
          dbhandle.actlogsCreate('invalid', Date.now(), 'Login Failed: ' + info, 'none', req.ip);
          return res.render('login', {layout:'empty', error:info});
        }
        if (passportuser) {
          const user = passportuser;
          dbhandle.actlogsCreate(user.userN, Date.now(), 'Login Successful', 'none', req.ip);
          user.token = passportuser.generateJWT();
          res.cookie('token', user.toAuthJSON());
          res.cookie('me',user.userN);
          res.cookie('fileAI','');
          if (user.level.toUpperCase()=='SYSADMIN') res.redirect('/kalikot');
          else if ((user.level.toUpperCase()!='SECRETARY') && (user.level.toUpperCase()!='EXECUTIVE')) {
            res.redirect('/explorer');
          } else res.redirect('/dashlogs');

        }
      })(req, res, next);
    });

    //validate password through passport login
    passport.use('login', new localStrategy({
      username: 'username',
      password: 'password'
    }, function (username, password, done){
      try {
        //Find the user associated with the email provided by the user
        userModel.findOne({ userN:username }, function(err, user){
          if (err) { console.log(err); return done(err); }
          if (!user) {
            console.log('User not found');
            return done(null, false, "wrongUser");
          }
          //Validate password and make sure it matches with the corresponding hash stored in the database
          if(!user || !user.validatePassword(password)) {
            console.log('invalid password')
            return done(null, false, "wrongPass"); //deny sender to login
          } else {
            //ensure presence of folders in the file server
            if (!fs.existsSync(drive+user.group)) fs.mkdirSync(drive+user.group);
            if (!fs.existsSync(drive+user.group + '/Signature')) fs.mkdirSync(drive+user.group + '/Signature');
            //create QR code for the hash password
            qrcode.toFile(drive+user.group+'/Signature/' + username +'.login.qr.png', password, { color: {dark: '#00F', light: '#0000'}, width: 300, height: 300 }, async function (err) {
              clearIncoming(username);
              return done(null, user, "Valid"); //allow sender to login
            });
          }
        });
      } catch (error) {
        return done(error);
      }
    }));

    function clearIncoming(username) {
      //clear mails
      dbhandle.userFind(username, (user)=>{
        var arrMail = new Array;
        user.mailfiles.forEach((item) => {
          arrMail.push(item);
        });
        while (arrMail.length > 5) {
          arrMail.shift();
        }
        dbhandle.userUpdMail(username, arrMail,()=>{});
        //clear branch incoming
        let disPath = drivetmp + user.group + '/';
        if (!fs.existsSync(disPath)) fs.mkdirSync(disPath);
        let deyt = Date.now();
        fs.readdir(disPath, function(err,items){
          if (items.length > 10) {
            items.forEach((disFile)=>{
              try{
                let fTime = new Date(fs.statSync(disPath + disFile).birthtime);
                let nrDays = (deyt - fTime) / (1000 * 3600 * 24);
                //if (nrDays > daysexpire) {
                monitoring.getOriginator(disFile, function(branch){
                  monitoring.findLastBranch(disFile, user.group, function(found){
                    if (((found) && (branch.toString().toUpperCase()==user.group.toUpperCase())) ||  (branch.toString().toUpperCase() == 'ALL BRANCHES')) {
                      ////if action or routed branch and routed for all branches by the admin
                      if (nrDays > (daysexpire + 10)){
                        dbhandle.docFind(disPath + disFile, function(disRes){
                          if (disRes) dbhandle.docDel(disPath + disFile,()=>{});
                        });
                        dbhandle.monitorFindFile(disFile, function(result) { //delete in monitoring
                          if (result) {
                            dbhandle.monitorDel(disFile, function(){});
                            dbhandle.actlogsCreate(username, Date.now(), 'File deleted from monitoring (more than 20 days and action branch)', disFile , 'none');
                          }
                        });
                        if (!fs.existsSync(drive + 'incoming/' + disFile)) {
                          fs.copyFile(disPath + disFile, drive + 'incoming/' + disFile, (err)=>{
                            if (!err) fs.unlink(disPath + disFile, (err)=>{if (err) console.log(err);});
                          });
                        } else fs.unlink(disPath + disFile, (err)=>{if (err) console.log(err);});
                        dbhandle.actlogsCreate(username, Date.now(), 'File deleted and transferred to File Server - incoming (more than 20 days and for info only)', disFile , 'none');
                      }
                    } else if (!found)  { // if for info only
                      if (nrDays > daysexpire){
                        dbhandle.docFind(disPath + disFile, function(disRes){
                          if (disRes) dbhandle.docDel(disPath + disFile,()=>{});
                        });
                        if (!fs.existsSync(drive + 'incoming/' + disFile)) {
                          fs.copyFile(disPath + disFile, drive + 'incoming/' + disFile, (err)=>{
                            if (!err) fs.unlink(disPath + disFile, (err)=>{if (err) console.log(err);});
                          });
                        } else fs.unlink(disPath + disFile, (err)=>{if (err) console.log(err);});
                        dbhandle.actlogsCreate(username, Date.now(), 'File deleted and transferred to File Server - incoming (more than 10 days)', disFile , 'none');
                      }
                    }
                  });
                });
                //}
              } catch(err){}
            });
          }
        });

        //clear incoming temp
        let inPath = drivetmp + 'incoming-temp/';
        if (!fs.existsSync(inPath)) fs.mkdirSync(inPath);
        fs.readdir(inPath, function(err,items){
          if (items.length > 10) {
            items.forEach((disFile)=>{
              try{
                let fTime = new Date(fs.statSync(inPath + disFile).birthtime);
                let nrDays = (deyt - fTime) / (1000 * 3600 * 24);
                if (nrDays > daysexpire) {
                  if (!fs.existsSync(drive + 'incoming/' + disFile)) {
                    fs.copyFile(inPath + disFile, drive + 'incoming/' + disFile, (err)=>{
                      if (!err){
                        fs.unlink(inPath + disFile, (err)=>{if (err) console.log(err);});
                      }
                    });
                  } else fs.unlink(inPath + disFile, (err)=>{if (err) console.log(err);});
                  dbhandle.actlogsCreate(username, Date.now(), 'File deleted and transferred to File Server - incoming', disFile , 'none');
                }
              } catch(err){}
            });
          }
        });
      });
    }
  });
};
