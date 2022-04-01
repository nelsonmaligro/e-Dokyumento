/*
Helper Modules for App Utilies
- Provides utility functions for the main app

@module multiple modules for App Utilities
@author Nelson Maligro
@copyright 2020
@license GPL
*/
const fs = require('fs');
const path = require('path');
const dateformat = require('dateformat');
const jwt = require('jsonwebtoken');
const express = require('express');
const { spawn } = require('child_process');
const dbhandle = require('./dbhandle');
const os = require('os');
const verifyPDF = require('./verify/verifyPDF');
const VerifyPDFError = require('./verify/VerifyPDFError');
const {plainAddPlaceholder, extractSignature, findByteRange, removeTrailingNewLine} = require ('./dist/helpers');
const verextractSignature = require ('./verify/helpers/extractSignature');
//const pdfSign = require('node-pdfsign');
//var promise = require('promise');
let topmgmt = 'GM';
var drivetmp = "public/drive/"; let drive = "D:/Drive/";let transferPath='N:/';
dbhandle.settingDis((setting)=>{drivetmp = setting.publicdrive;});
dbhandle.settingDis((setting)=>{transferPath = setting.transferpath;});
dbhandle.settingDis((setting)=>{topmgmt = setting.topmgmt;});

dbhandle.settingDis((setting)=>{
  drive = setting.maindrive;
  const { extractSignature } = require ('./dist/helpers');
  const { getCertificatesInfoFromPDF } = require('./verify/certificateDetails');
  //function for Handling Routing Slip
  exports.resolveRoutingSlip  = function (found, disFile) {
    var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
    makeDir(drive + 'Routing Slip/', year, month);
    if (fs.existsSync(drivetmp + 'PDF-temp/routeorig-'+ disFile +'.pdf')) fs.unlinkSync(drivetmp + 'PDF-temp/routeorig-'+ disFile +'.pdf');

    var routfile = "";
    if (found) routfile = found.routeslip;
    else routfile = drive + 'Routing Slip/'+year+'/'+month+'/'+'route-'+ disFile +'.pdf';

    if (fs.existsSync(routfile)) {
      fs.copyFileSync(routfile,drivetmp + 'PDF-temp/route-'+ disFile +'.pdf');
      if (routfile.toUpperCase() != (drive + 'Routing Slip/'+year+'/'+month+'/'+'route-'+ disFile +'.pdf').toUpperCase()) fs.copyFileSync(routfile,drive + 'Routing Slip/'+year+'/'+month+'/'+'route-'+ disFile +'.pdf');
    } else {
      fs.copyFileSync(drivetmp + 'routeblank.pdf',drivetmp + 'PDF-temp/route-'+ disFile +'.pdf');
      fs.copyFileSync(drivetmp + 'routeblank.pdf',drive + 'Routing Slip/'+year+'/'+month+'/'+'route-'+ disFile +'.pdf');
    }
  };
  //store db metadata to file
  exports.savemetatofile = function (filename, ref, enc, comment, callback) {
     //verify folders
     if (fs.existsSync(transferPath)){
       try {
         if (!fs.existsSync(transferPath +'metadata')) fs.mkdirSync(transferPath +'metadata');
         if (!fs.existsSync(transferPath +'metadata/reference')) fs.mkdirSync(transferPath +'metadata/reference');
         if (!fs.existsSync(transferPath +'metadata/enclosure')) fs.mkdirSync(transferPath +'metadata/enclosure');
         let strWrite = '';
         //store References
         ref.forEach((item, i) => {
           if (fs.existsSync(item)) fs.copyFileSync(item, transferPath + 'metadata/reference/' + path.basename(item));
           strWrite = strWrite + 'ref::'+ path.basename(item) + '\r\n';
         });
         //store Enclosures
         enc.forEach((item, i) => {
           if (fs.existsSync(item)) fs.copyFileSync(item, transferPath + 'metadata/enclosure/' + path.basename(item));
           strWrite = strWrite + 'enc::'+ path.basename(item) + '\r\n';
         });
         //append comment
         strWrite = strWrite + 'comment::'+ JSON.stringify(comment);
         //store metadata to file
         fs.writeFileSync(transferPath+ 'metadata/' + filename + '.txt', strWrite);
         fs.copyFileSync(drivetmp + 'Release/' + filename, transferPath+filename);
         fs.unlinkSync(drivetmp + 'Release/' + filename);
         callback('success');
       } catch (error) {callback('fail');}
     } else {
       callback('fail');
     }

  }
  //get meta file and out to array
  exports.metafiletoarray = function (filename, path, callback) {
    let arrRef = [], arrEnc = [], arrComment = [];
          let strCont = fs.readFileSync(path + filename+'.txt', 'UTF-8'); //read the metafile
          let strLines = strCont.split(/\r?\n/); //read by lines
          strLines.forEach((item, i) => {
            data = item.split('::');// split the string to get the actual file and array
            switch (data[0]) {
              case 'ref': //copy ref file from web temp path /group/metadata to drive/incoming...store to array
                if (fs.existsSync(path + 'reference/' + data[1])) {
                  fs.copyFileSync(path + 'reference/' + data[1], drive + 'incoming/'+ data[1]);
                  fs.unlinkSync(path + 'reference/' + data[1]);
                }
                arrRef.push(drive + 'incoming/'+ data[1]);
                break;
              case 'enc': //copy enc file from web temp path /group/metadata to drive/incoming...store to array
                if (fs.existsSync(path + 'enclosure/' + data[1])) {
                  fs.copyFileSync(path + 'enclosure/' + data[1], drive + 'incoming/'+ data[1]);
                  fs.unlinkSync(path + 'enclosure/' + data[1]);
                }
                arrEnc.push(drive + 'incoming/'+ data[1]);
                break;
              case 'comment': //parse the comment in JSON string and store to array
                arrComment = JSON.parse(data[1]);break;
            }
          });
          callback(arrRef,arrEnc,arrComment); //output ref, enc, comment
  }
  //validate token
  exports.validToken = function (req, res, callback){
    var token = req.cookies['token'];
    if (!token) { return res.render('login', {layout:'empty', error:'Valid'});}
    jwt.verify(token.token, 'secret', function (err, decoded){
      if (err) { console.log('token error'); return res.render('login', {layout:'empty', error:'Valid'});}
      callback(decoded, req.cookies['me']);
    });
  };
  //validate token from android app
  exports.validTokenAndroid = function (req, res, callback){
    var token = req.cookies['token'];
    try { token = JSON.parse(token);} catch {}
    if (!token) { callback([], 'invalid');} //if no token
    else { //if token is available
      jwt.verify(token.token, 'secret', function (err, decoded){
        if (err) { console.log('token error'); callback([], 'invalid');} //invalid token
        else callback(decoded, token.userN); //invalid token
      });
    }
  };
  //function generate unique numeric // ID
  exports.generateID = function generateID(){
    var dateVal = Date.now().toString();
    var randomVal = (Math.floor(Math.random() * Math.floor(9))).toString();
    var id = Math.floor(dateVal+randomVal);
    return id;
  };
  //function make dir for year and month
  exports.makeDir =  function(path, year, month) {
    makeDir(path, year, month);
  };
  //function verify digital signature
  exports.verifySign = function(path){
    let signedPdfBuffer = fs.readFileSync(path);
    let verifyResult = verifyPDF(signedPdfBuffer);
    return verifyResult;
  };

  //run ML from python
  exports.runPy = function (pathPy, pathtxt){
    return new Promise(function(success, nosuccess) {
      const pyprog = spawn('python',[path.resolve(pathPy),pathtxt]);
      pyprog.stdout.on('data', function(data) {
        success(data);
      });
      pyprog.stderr.on('data', (data) => {
        nosuccess(data);
      });
    });
  };

  //read directories function
  exports.getDirs = function (path){
    var newpath = path;
    if (path.substring(path.length-1)!="/") newpath = path + "/";
    return fs.readdirSync(newpath).filter(function (file){
      try{
        return fs.statSync(newpath+file).isDirectory();
      }catch{}
    });
  }
  //read files function
  exports.getFiles = function (path){
    var newpath = path;
    if (path.substring(path.length-1)!="/") newpath = path + "/";
    return fs.readdirSync(newpath).filter(function (file){
      try{
        return fs.statSync(newpath+file).isFile();
      }catch{}

    });
  }
  //handle set timeout
  exports.sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  //process additional hashtags
  exports.addTag = function (modelTag, Tags){
    arrTag = JSON.parse(Tags);
    if (arrTag.length > 0){
      arrTag.forEach(function (tag){
        dbhandle.addList(modelTag,tag);
      });
    }
  }
  exports.validateQRPass = function (user, pass, callback){
    dbhandle.validatePassword(user, pass, function (result){
      if (result) {
        callback(result);
      } else {
        dbhandle.validateFullname(user, pass, function (disresult){
          callback(disresult);
        });
      }
    });
  }
  //check permission error;
  exports.checkPermission = function(items, path) {
    let sortArr = [];
    if (items) {
      items.forEach((item)=>{
        try {fs.statSync(path+item).mtime; sortArr.push(item);}
        catch (err) {}
      });
      sortArr.sort((a, b)=>{
        if (os.platform()=='linux') return  fs.statSync(path+b).mtime - fs.statSync(path+a).mtime;
        else return  fs.statSync(path+b).birthtime - fs.statSync(path+a).birthtime;
      });
    }
    return sortArr;
  }

  function makeDir(path, year, month){
    if (!fs.existsSync(path+year)){
      fs.mkdirSync(path+year);
    }
    if (!fs.existsSync(path+year+'/'+month)){
      fs.mkdirSync(path+year+'/'+month);
    }
  }

});
//get branches with EXECUTIVE levels
exports.getExecBranch = function (callback){
  dbhandle.genUsers((users)=>{
    let arrBr = [];
    users.forEach((item, i) => {
      if (item.level.toUpperCase()=='EXECUTIVE') arrBr.push(item.group);
    });
    uniqBr = arrBr.filter(function(item, pos) { return arrBr.indexOf(item) == pos; }); //get unique array
    callback(uniqBr);
  });
}
