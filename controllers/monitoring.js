/*
Helper Modules for Monitoring Routed Documents

@module multiple modules for App Utilities
@author Nelson Maligro
@copyright 2020
@license GPL
*/
const path = require('path');
const  fs = require('fs');
const dbhandle = require('./dbhandle');
const dateformat = require('dateformat');
var promise = require('promise');
const promisify = require('util').promisify;
//handle new document for monitoring
exports.addMonitor = function addMonitor(req, res, path){
  console.log('Add File Monitoring');
  deyt = dateformat(Date.now(),"dd mmm yyyy HH:MM");
  dbhandle.monitorFindTitle(req.body.monitfile, function(result){
    if (!result) {
      dbhandle.monitorCreate (req.body.newfile, req.body.newfile, deyt, req.body.branch, path);
      dbhandle.commologsUpdate (dateformat(Date.now(),'yyyy'), dateformat(Date.now(),'mmm').toUpperCase(), req.body.branch.toUpperCase(),()=>{});
    } else dbhandle.monitorEdit (req.body.newfile, result.filename, deyt, req.body.branch, path);
  });
};

//handle updating of filename in monitor
exports.updateMonitor = function (req, res){
  console.log('Add File Monitoring');
  deyt = dateformat(Date.now(),"dd mmm yyyy HH:MM");
  dbhandle.monitorFindTitle(req.body.fileroute, function(result){
    if (result) dbhandle.monitorUpdateFile (result.filename, req.body.newfile, result.route, result.filepath,()=>{});
  });
};

//handle adding routing branch to the document in the monitoring.....document is openned in the file server (file open command)
exports.UpdFileMonitor = function (req, res, user, path){
  console.log('Update File Monitoring');
  deyt = dateformat(Date.now(),"dd mmm yyyy HH:MM"); arrBr = [];
  dbhandle.monitorFindTitle(req.body.monitfile, function(result){
    if (result) {
      result.route.push({deyt:deyt,branch:req.body.branch});
      dbhandle.monitorAddRoute(req.body.newfile, result.filename, result.route, path);
    } else {
      //add the user who openned the file as the originator of the doc in the monitoring
      if (user.level.toUpperCase()!="SECRETARY") arrBr.push(user.group.toUpperCase());
      req.body.branch.forEach((itemBr)=> {
        if  (itemBr.toUpperCase()!=user.group.toUpperCase()) arrBr.push(itemBr.toUpperCase());
      });
      dbhandle.monitorCreate (req.body.newfile, req.body.newfile, deyt, arrBr, path);
      dbhandle.commologsUpdate (dateformat(Date.now(),'yyyy'), dateformat(Date.now(),'mmm').toUpperCase(), user.group.toUpperCase(),()=>{});
    }
  });
};
//handle adding routing branch to the document in the monitoring.....document is within incoming branches
exports.addRouteOnly = function (filename, branch, path){
  console.log('Add Branch to Route Monitoring no change to title');
  dbhandle.monitorFindTitle(filename, function(result){
    deyt = dateformat(Date.now(),"dd mmm yyyy HH:MM");
    if (result) {
      result.route.push({deyt:deyt,branch:branch});
      dbhandle.monitorAddRoute(filename, result.filename, result.route, path);
    } else {
      dbhandle.monitorCreate (filename, filename, deyt, branch, path);
      dbhandle.commologsUpdate (dateformat(Date.now(),'yyyy'), dateformat(Date.now(),'mmm').toUpperCase(), JSON.stringify(branch).toUpperCase(),()=>{});
    }
  });

};

//handle search throught reference and enclosure

exports.searchRefEnc = function (req, callback){
  var found = false; var disPath = null, disFile= null; var flag = false;
  //console.log('Search reference and enclosure in monitoring');
  var arrRef = JSON.parse(req.body.refs);var arrEnc = JSON.parse(req.body.encs);
  if (((arrRef.length != 0) && (req.body.refs!=null)) || ((arrEnc.length != 0) && (req.body.encs!=null)))  {
    var refPromise = new promise((resolve, reject)=>{
      if ((arrRef.length != 0) && (req.body.refs!=null)) {
        arrRef.forEach (function(ref, index) {
          dbhandle.tempmonitorFindFile(ref.file, function(disresult){
            if (disresult) { flag= true;
              if (ref.path.substring(ref.path.length-1)=='/') ref.path = ref.path.substring(0, ref.path.length-1);
              dbhandle.docFind(ref.path+'/'+ref.file, function (disfound){
                //console.log(ref.path+'/'+ref.file);
                if (disfound){
                  if (fs.existsSync(disfound.routeslip)){
                    found = true;disPath = ref.path; disFile = ref.file;
                    reject();
                  }
                }
                //console.log(index);
                if (index == arrRef.length-1) resolve();
              });
            }
            if ((index == arrRef.length-1) && (flag == false)) resolve();
          });
        });
      } else resolve();
    });
    refPromise.then(()=> {
      flag = false;
      var encPromise = new promise((resolve, reject)=>{
        if ((arrEnc.length != 0) && (req.body.encs!=null)) {
          arrEnc.forEach (function(enc, index) {
            dbhandle.tempmonitorFindFile(enc.file, function(disresult){
              if (disresult) { flag = true;
                if (enc.path.substring(enc.path.length-1)=='/') enc.path = enc.path.substring(0, enc.path.length-1);
                dbhandle.docFind(enc.path+'/'+enc.file, function (disfound){
                  if (disfound){
                    if (fs.existsSync(disfound.routeslip)){
                      found = true;disPath = enc.path; disFile = enc.file;
                      reject();
                    }
                  }
                  if (index == arrEnc.length-1) resolve();
                });
              }
              if ((index == arrEnc.length-1) && (flag == false)) resolve();
            });
          });
        } else resolve();
      });
      encPromise.then(()=>{
        //console.log('finishenc');
        if (!found) return callback(null, null);
      }).catch(()=>{
        //console.log("enc"+disFile);
        return callback(disPath, disFile);
      });

    }).catch(()=>{
      //console.log("ref"+disFile);
      return callback(disPath, disFile);
    });
  }else {
    //console.log('finishref');
    return callback(null, null);
  }
};

//get the origina branch from the monitoring
exports.getOriginator = function (filename, callback){
  console.log('Get Originator from Monitoring');
  dbhandle.monitorFindTitle(filename, function(result){
    if (result) callback(result.route[0].branch[0]);
    else callback('');
  });
};
//get last branch routed
//check if the current group is within the last branch routed
exports.findLastBranch = function (filename, group, callback){
  dbhandle.monitorFindTitle(filename, function(result){
    if (result){
      let disRoute = result.route[result.route.length-1];
      if (disRoute.branch.toString().toUpperCase().includes(group.toUpperCase())) callback(true);
      else callback(false);
    }
    else callback(false);
  });
};
