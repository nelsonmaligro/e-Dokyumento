/*
Helper Modules for Routing Documents
    - Provides routing utility function for the main app

@module docRouting
@author Nelson Maligro
@copyright 2020
@license GPL
*/
const path = require('path');
const  fs = require('fs');
const dateformat = require('dateformat');
const dbhandle = require('./dbhandle');
const getcontent = require('./getcontent');
var drivePublic = "public/drive/", driveMain = "D:/Drive/";
dbhandle.settingDis((setting)=>{drivePublic = setting.publicdrive;});
//var driveMain = "D:/drive/";
//var drivePublic = "public/drive/";
dbhandle.settingDis((setting)=>{
  driveMain = setting.maindrive;
  //handle updating document database
  function updateDBdoc(dst, file, req){
    dbhandle.docFind(dst + file, function(res){
      var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
      makeDir(driveMain + 'Routing Slip/',year, month);
      getcontent.getContent(dst + req.body.newfile,req.body.newfile,function (discontent){
        //console.log(req.body.fileroute+':'+req.body.newfile);
        if (fs.existsSync(drivePublic + 'PDF-temp/route-'+ req.body.fileroute +'.pdf')) fs.copyFileSync(drivePublic + 'PDF-temp/route-'+ req.body.fileroute +'.pdf',driveMain+'Routing Slip/'+year+'/'+month+'/'+'route-'+req.body.newfile+'.pdf');
        var routslipTemp = driveMain+'Routing Slip/'+year+'/'+month+'/'+'route-'+req.body.newfile+'.pdf';
        discontent = discontent.substring(0,2000);
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
        //console.log( dst+req.body.newfile+'#'+req.body.class+':'+req.body.tag+':'+newRef+':'+newEnc+':'+newComm)
        if (!res) dbhandle.docCreate (generateID(), req.body.newfile, dst+req.body.newfile, req.body.class, req.body.user, JSON.parse(req.body.tag), Date.now().toString(), fs.statSync(dst + req.body.newfile).size, discontent, routslipTemp, newRef, newEnc, newComm);
        else  dbhandle.docEdit (res.id,req.body.newfile, dst+req.body.newfile, req.body.class, req.body.user, JSON.parse(req.body.tag), Date.now().toString(), fs.statSync(dst + req.body.newfile).size, discontent, routslipTemp, newRef, newEnc, newComm);
      });
    });
  }
  //handle updating document database no refence and enclosure
  function updateDBdocNoRefEncIncoming(src, dst, req){
    dbhandle.docFind(src + req.body.fileroute, function(res){
      if (res) {
        dbhandle.docFind(dst + req.body.fileroute, function(disRes){
          var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
          makeDir(driveMain + 'Routing Slip/',year, month);
          //olddst = dst; dst = dst + req.body.fileroute;
          if (fs.existsSync(drivePublic + 'PDF-temp/route-'+ req.body.fileroute +'.pdf')) fs.copyFileSync(drivePublic + 'PDF-temp/route-'+ req.body.fileroute +'.pdf',driveMain+'Routing Slip/'+year+'/'+month+'/'+'route-'+req.body.fileroute+'.pdf');
          var routslipTemp = driveMain+'Routing Slip/'+year+'/'+month+'/'+'route-'+req.body.fileroute+'.pdf';
          var arrComment = JSON.parse(req.body.comments); let newComm = [];
          if (disRes) newComm = disRes.comment;
          arrComment.forEach(function (comment){
            let nothere = true;
            if (disRes){
              disRes.comment.forEach((comme)=>{
                if (comme.branch.toUpperCase() == comment.branch.toUpperCase()) nothere = false;
              });
            }
            if (nothere) {newComm.push({branch:comment.branch, content:comment.content});}
          });

            if (!disRes) dbhandle.docCreate (generateID(), req.body.fileroute, dst+req.body.fileroute, res.category, res.author, res.projects, res.deyt, res.size, res.content, routslipTemp, res.reference, res.enclosure, newComm);
            else dbhandle.docUpdateNoRefEncIncoming(dst + req.body.fileroute, routslipTemp, newComm);
        });
      }
    });
  }
  //handle updating document database no refence and enclosure
  function updateDBdocNoRefEnc(src, dst, req){
    dbhandle.docFind(src + req.body.fileroute, function(res){
      if (res){
        var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
        makeDir(driveMain + 'Routing Slip/',year, month);
        //olddst = dst; dst = dst + req.body.fileroute;
        if (fs.existsSync(drivePublic + 'PDF-temp/route-'+ req.body.fileroute +'.pdf')) fs.copyFileSync(drivePublic + 'PDF-temp/route-'+ req.body.fileroute +'.pdf',driveMain+'Routing Slip/'+year+'/'+month+'/'+'route-'+req.body.fileroute+'.pdf');
        var routslipTemp = driveMain+'Routing Slip/'+year+'/'+month+'/'+'route-'+req.body.fileroute+'.pdf';
        var arrComment = JSON.parse(req.body.comments); newComm = [];
        arrComment.forEach(function (comment){
          newComm.push({branch:comment.branch, content:comment.content});
        });
        dbhandle.docFind(dst + req.body.fileroute, function(disRes){
            if ((disRes) && (res.id!=disRes.id)) {dbhandle.docDel(dst + req.body.fileroute,()=>{dbhandle.docUpdateNoRefEnc(res.id, dst + req.body.fileroute, routslipTemp, newComm);});}
            else dbhandle.docUpdateNoRefEnc(res.id, dst + req.body.fileroute, routslipTemp, newComm);
        });
      }
    });
  }
  //handle updating document database for royalty
  function updateDBdocRoyal(src, dst, req){
    dbhandle.docFind(src, function(res){
      if (res){
        var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
        makeDir(driveMain + 'Routing Slip/',year, month);
        //olddst = dst; dst = dst + req.body.fileroute;
        if (fs.existsSync(drivePublic + 'PDF-temp/route-'+ req.body.fileroute +'.pdf')) fs.copyFileSync(drivePublic + 'PDF-temp/route-'+ req.body.fileroute +'.pdf',driveMain+'Routing Slip/'+year+'/'+month+'/'+'route-'+req.body.fileroute+'.pdf');
        var routslipTemp = driveMain+'Routing Slip/'+year+'/'+month+'/'+'route-'+req.body.fileroute+'.pdf';
        var arrComment = JSON.parse(req.body.comments); newComm = [];
        arrComment.forEach(function (comment){
          newComm.push({branch:comment.branch, content:comment.content});
        });
        dbhandle.docFind(dst, function(disRes){
            if ((disRes) && (res.id!=disRes.id)) {dbhandle.docDel(dst,()=>{dbhandle.docUpdateNoRefEnc(res.id, dst, routslipTemp, newComm);});}
            else dbhandle.docUpdateNoRefEnc(res.id, dst, routslipTemp, newComm);
          });
      }
    });
  }
  exports.savenochange = function (req, res, drivetmp, drive){
    let oldsrc =path.resolve(drivetmp+"/" + req.body.fileroute);
    let newsrc =path.resolve(drivetmp+"/" + req.body.newfile);
    //Auto rename files
    fs.rename(oldsrc, newsrc, function(err) {
      //if (err) console.log(err);
      console.log('Rename complete!');
      let dst = drive + req.body.newfile;
      fs.copyFile(newsrc, dst, function(err) {
        //if (err) console.log(err);
        fs.unlink(newsrc, function(err) {
          //if (err) console.log(err);
          console.log('File was removed from release');
          return res.json('successful');
        });
        dbhandle.docFind(drivetmp+"/" + req.body.fileroute, function(res){
          dbhandle.docFind(dst, function(disRes){
              if ((disRes) && (res.id!=disRes.id)) {dbhandle.docDel(dst,()=>{dbhandle.docUpdateNoRefEnc(res.id, dst, res.routeslip, res.comment);});}
              else {if (res) dbhandle.docUpdateNoRefEnc(res.id, dst, res.routeslip, res.comment);}
          });
        });
      });
    });
  };
  //routing for the deputy and CO
  exports.routRoyal = function (req, res, src, dst, file, origsrc){
    fs.copyFile(src, dst, function(err) {
      //if (err) console.log(err);
      console.log("Successfully copied to Royalty branch for release!");
      updateDBdocRoyal(origsrc, dst, req);//Update document database
      //remove from temp after copy to incoming
      fs.unlink(origsrc, async function(err) {
        //if (err) console.log(err);
        if (fs.existsSync(src)) fs.unlinkSync(src);
        await res.json('successful');

      });
    });
  };
  //routing no changes to reference and enclosure
  exports.routNoRefEnc = function (req, res, src, dst){
    var newsrc =path.resolve(src + req.body.fileroute);
    var newdst = path.resolve(dst + req.body.fileroute);
    fs.copyFile(newsrc, newdst, function(err) {
      //if (err) console.log(err);
      console.log("Successfully copied to incoming!");
      updateDBdocNoRefEnc(src, dst, req);//Update document database
      //remove from temp after copy to incoming
      fs.unlink(newsrc, async function(err) {
        //if (err) console.log(err);
        await res.json('successful');

      });
    });
  };
  //routing no changes to reference and enclosure
  exports.routNoRefEncIncoming = function (req, res, src, branches){
    var newsrc =src + req.body.fileroute;
     //route to specific branches
    req.body.branch.forEach (function(branch){
        var dst = drivePublic + branch +"/";
        if (branch.toUpperCase()!='ALL BRANCHES')  {
          if (!fs.existsSync(drivePublic + branch)) fs.mkdirSync(drivePublic + branch);
          if ((dst + req.body.fileroute).toUpperCase() != newsrc.toUpperCase()) {
            fs.copyFile(newsrc, dst+req.body.fileroute, function(err) {
              console.log("Successfully copied to " + branch);

              //updateDBdoc(dst, req.body.fileroute, req);//update database
            });
          }
          updateDBdocNoRefEncIncoming(src, dst, req);//Update document database
        };
      });
      //if all branches
      if (req.body.branch.toString().toUpperCase().includes('ALL BRANCHES')){
        branches.forEach (function (branch){
          if (!req.body.branch.includes(branch) && (branch.toUpperCase()!="EXO") && (branch.toUpperCase()!="DN6") && (branch.toUpperCase()!="N6") && (branch.toUpperCase()!="ASST.G.M.") && (branch.toUpperCase()!="G.M.") && (branch.toUpperCase()!="SECRETARY-RECEIVING")) {
            var dst = drivePublic + branch +"/";
            if (!fs.existsSync(drivePublic + branch)) fs.mkdirSync(drivePublic + branch);
            if ((dst + req.body.fileroute).toUpperCase() != newsrc.toUpperCase()) {
              fs.copyFile(newsrc, dst+req.body.fileroute, function(err) {
                console.log("Successfully copied to " + branch);
                //updateDBdoc(dst, req.body.fileroute, req);//update database
              });
            }
            updateDBdocNoRefEncIncoming(src, dst, req);//Update document database
          };
        });
      };
      //remove from temp after copy to incoming
      if (!req.body.branch.toString().toUpperCase().includes('ALL BRANCHES')) {
        //dbhandle.docDel(newsrc,()=>{});
        fs.unlink(newsrc, async function(err) {
          await res.json('successful');
          setTimeout(()=>{
            dbhandle.docDel(newsrc,()=>{});
          },5000);
        });
      } else res.json('successful');

  };
  exports.routeThis = function routeThis(req, res, drivetmp, drive, incoming, branches, usrLvl, usrGrp, callback){
    var oldsrc =path.resolve(drivetmp+"/" + req.body.fileroute);
    var newsrc =path.resolve(drivetmp+"/" + req.body.newfile);
    var dstincoming = incoming + req.body.newfile;
    //Auto rename filesS
    new Promise((resolve, reject)=>{
      if ((req.body.path + req.body.fileroute) != (req.body.path + req.body.newfile))
        {
          fs.rename(oldsrc, newsrc, function(err) {
            if (!err) {console.log('Rename complete!'); resolve();}
            else {res.json('fail'); callback(false); reject();}
          });
        } else resolve();
    }).then(()=>{
      if (req.body.save=='openroute') updateDBdoc(req.body.path, req.body.fileroute, req);//Update document database
      //copy to incoming
      fs.copyFile(newsrc, dstincoming, function(err) {
        //if (err) console.log(err);
        console.log("Successfully copied to incoming!");
        if ((usrLvl.toUpperCase()==='DUTYADMIN') || (usrLvl.toUpperCase()==='SECRETARY')) updateDBdoc(incoming, req.body.newfile, req);//update database
        var dst =  "";
        req.body.branch.forEach (function(branch){
          if (branch.toUpperCase()!='ALL BRANCHES')  {
            dst = drive + branch +"/"+ req.body.newfile;
            if (!fs.existsSync(drive + branch)) fs.mkdirSync(drive + branch);
            if (path.resolve(dst).toUpperCase() != path.resolve(newsrc).toUpperCase()){
              fs.copyFile(dstincoming, dst, function(err) {
                //if (err) console.log(err);
                console.log("Successfully copied to " + branch);
                updateDBdoc(drive + branch +"/", req.body.newfile, req);//update database
              });
            }
            //add to AI/ ML trainining datasets
            if ((usrLvl.toUpperCase()=='DUTYADMIN') || (usrLvl.toUpperCase()=='SECRETARY')) aiTrain(driveMain + 'textML/'+req.body.fileroute+'.txt',driveMain + 'textML/'+branch,req.body.fileroute);
          };
        });
        //if all branches
        if (req.body.branch.toString().toUpperCase().includes('ALL BRANCHES')){
          branches.forEach (function (branch){
            if (!req.body.branch.includes(branch) && (branch.toUpperCase()!="EXO") && (branch.toUpperCase()!="DN6") && (branch.toUpperCase()!="N6")  && (branch.toUpperCase()!="ASST.G.M.") && (branch.toUpperCase()!="G.M.") && (branch.toUpperCase()!="SECRETARY-RECEIVING")) {
              dst = drive + branch +"/"+ req.body.newfile;
              if (!fs.existsSync(drive + branch)) fs.mkdirSync(drive + branch);
              if (path.resolve(dst).toUpperCase() != path.resolve(newsrc).toUpperCase()){
                fs.copyFile(dstincoming, dst, function(err) {
                  //if (err) console.log(err);
                  console.log("Successfully copied to " + branch);
                  updateDBdoc(drive + branch +"/", req.body.newfile, req);//update database
                });
              }
            };
          });
        };
        //remove from temp after copy to incoming
        setTimeout(()=>{
          if (req.body.save!='openroute'){
            if (!req.body.branch.toString().toUpperCase().includes('ALL BRANCHES')) {
              fs.unlink(newsrc, async function(err) {
                if (!err) console.log('File was removed from temp');
                await res.json('successful');
              });
            } else {
              if ((usrLvl.toUpperCase()==='DUTYADMIN') || (usrLvl.toUpperCase()==='SECRETARY')) {
                fs.unlink(newsrc, async function(err) {
                  if (!err) console.log('File was removed from temp');
                  await res.json('successful');
                });
              } else res.json('successful');
            }
          }else res.json('successful');
        },5000);
      });
      callback(true);
    }).catch((err)=>{});
  };
  exports.saveThis = function saveThis(req, res, drivetmp, drive){
    var oldsrc =path.resolve(drivetmp+"/" + req.body.fileroute);
    var newsrc =path.resolve(drivetmp+"/" + req.body.newfile);
    //Auto rename files
    new Promise((resolve,reject)=>{
      if ((req.body.path + req.body.fileroute) != (req.body.path + req.body.newfile))
        {
          fs.rename(oldsrc, newsrc, function(err) {
            if (!err) {
              updateDBdoc(drivetmp+"/", req.body.newfile, req);//update database
              console.log('Rename complete!'); resolve();
            } else reject();
          });
        } else {
          updateDBdoc(drivetmp+"/", req.body.newfile, req);//update database
          resolve();
        }
    }).then(()=>{
      if (!fs.existsSync(drive + req.body.class)) fs.mkdirSync(drive + req.body.class);
      var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
      makeDir(drive + req.body.class +'/', year, month);
      var dst = drive + req.body.class +"/" + year +'/'+month+'/'+ req.body.newfile;
      fs.copyFile(newsrc, dst, function(err) {
        //if (err) console.log(err);
        console.log("Successfully copied to classification Folder");
        updateDBdoc(drive + req.body.class +"/" + year +'/'+month+'/', req.body.newfile, req);//Update document database
        //add to AI/ ML trainining datasets
        aiTrain(driveMain + 'textML/'+req.body.fileroute+'.txt',driveMain + 'textML/'+req.body.class,req.body.fileroute);

        //copy to all tags
        arrTag = JSON.parse(req.body.tag);
        if (!fs.existsSync(drive + 'Tags/')) {fs.mkdirSync(drive + 'Tags/');}
        arrTag.forEach(function (tag){
          var tagdst = drive + 'Tags/' + tag +"/"+ req.body.newfile;
          if (!fs.existsSync(drive + 'Tags/' + tag)) fs.mkdirSync(drive + 'Tags/' + tag);
          fs.copyFile(dst, tagdst, function(err) {
            //if (err) console.log(err);
            console.log("Successfully copied to "+ tag);
            updateDBdoc(drive + 'Tags/' + tag +"/", req.body.newfile, req);//Update document database
            //add to AI/ ML trainining datasets
            aiTrain(driveMain + 'textML/'+req.body.fileroute+'.txt',driveMain + 'textML/'+tag,req.body.fileroute);
          });
        });
        return res.redirect('/incoming/'+ req.body.newfile);
      });
    }).catch((err)=>{});
  };
  exports.updateThis = function updateThis(req, res, drive, callback){
    var oldsrc =path.resolve(req.body.path + req.body.fileroute);
    var newsrc =path.resolve(req.body.path + req.body.newfile);
    //Auto rename files
    new Promise((resolve, reject)=>{
      if ((req.body.path + req.body.fileroute) != (req.body.path + req.body.newfile))
        {
          fs.rename(oldsrc, newsrc, function(err) {
            if (!err) {console.log('Rename complete!'); resolve();}
            else { res.json('fail'); callback(false); reject();}
          });
        } else resolve();
    }).then(()=>{
      updateDBdoc(req.body.path,  req.body.fileroute, req);//Update document database
      //copy to Classification folders
      if ((req.body.class.length>0) && (req.body.path != dst)){
        if (!fs.existsSync(drive + req.body.class)) fs.mkdirSync(drive + req.body.class);
        var year = dateformat(Date.now(),'yyyy');var month = dateformat(Date.now(),'mmm').toUpperCase();
        makeDir(drive + req.body.class +'/', year, month);
        var dst = drive + req.body.class +"/" + year +'/'+month+'/';
        if (fs.existsSync(dst + req.body.fileroute)){
          fs.rename(dst + req.body.fileroute, dst + req.body.newfile, function(err) {
            console.log("Successfully updated classification Folder");
            updateDBdoc(dst, req.body.fileroute, req);//Update document database
          });
        } else {
          fs.copyFile(newsrc, dst + req.body.newfile, function(err) {
            console.log("Successfully Added classification Folder");
            updateDBdoc(dst, req.body.fileroute, req);//Update document database
          });
        }
        //add to AI/ ML trainining datasets
        aiTrain(driveMain + 'textML/'+req.body.fileroute+'.txt',driveMain + 'textML/'+req.body.class,req.body.fileroute);
      }
      //copy to all tags
      if (!fs.existsSync(drive + 'Tags/')) {fs.mkdirSync(drive + 'Tags/');}
      arrTag = JSON.parse(req.body.tag);
      if (arrTag.length > 0){
        arrTag.forEach(function (tag){
          var tagdst = drive + 'Tags/' + tag +"/";
          if (!fs.existsSync(drive + 'Tags/' + tag)) fs.mkdirSync(drive + 'Tags/' + tag);
          if (fs.existsSync(tagdst + req.body.fileroute)){
            fs.rename(tagdst + req.body.fileroute, tagdst + req.body.newfile, function(err) {
              console.log("Successfully updated "+ tag);
              if (req.body.path != tagdst) updateDBdoc(drive + 'Tags/' + tag +"/", req.body.fileroute, req);//Update document database
            });
          }else{
            fs.copyFile(newsrc, tagdst + req.body.newfile, function(err) {
              console.log("Successfully added "+ tag);
              if (req.body.path != tagdst) updateDBdoc(drive + 'Tags/' + tag +"/", req.body.fileroute, req);//Update document database
            });
          }
          //add to AI/ ML trainining datasets
          aiTrain(driveMain + 'textML/'+req.body.fileroute+'.txt',driveMain + 'textML/'+tag,req.body.fileroute);
        });
      }
      res.json('successful'); callback(true);
    }).catch((err)=>{});
  };
  //function generate unique numeric // ID
  function generateID(){
    var dateVal = Date.now().toString();
    var randomVal = (Math.floor(Math.random() * Math.floor(9))).toString();
    var id = Math.floor(dateVal+randomVal);
    return id;
  };
  //function for adding AI or ML training datasets
  function aiTrain(src, dstPath, file){
    if (fs.existsSync(src)){
      if (!fs.existsSync(dstPath)) fs.mkdirSync(dstPath);
      fs.copyFile(src, dstPath+'/'+file+'.txt', function(err){
        //if (err) throw err;
        console.log('copied to AI trainig datasets');
      });
    }
  }
  function makeDir(path, year, month){
    if (!fs.existsSync(path+year)){
      fs.mkdirSync(path+year);
    }
    if (!fs.existsSync(path+year+'/'+month)){
      fs.mkdirSync(path+year+'/'+month);
    }
  };
});
