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
//var promise = require('promise');

var drivetmp = "public/drive/", drive = "D:/Drive/";
dbhandle.settingDis((setting)=>{drivetmp = setting.publicdrive;});

dbhandle.settingDis((setting)=>{
  drive = setting.maindrive;
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
  //validate token
  exports.validToken = function (req, res, callback){
    var token = req.cookies['token'];
    if (!token) { return res.render('login', {layout:'empty', error:'Valid'});}
    jwt.verify(token.token, 'secret', function (err, decoded){
      if (err) { return res.render('login', {layout:'empty', error:'Valid'});}
      callback(decoded, req.cookies['me']);
    });
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
