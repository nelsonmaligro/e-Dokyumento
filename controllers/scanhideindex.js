const fs = require('fs');
const hidefile = require('hidefile');
const dbhandle = require('./dbhandle');
var drive = "D:/Drive/";
dbhandle.settingDis((setting)=>{drive = setting.maindrive;});

function scanreindex(dir, folder, callback){
  function walkDir(currentPath, disFolder, callboy) {
    currentPath = currentPath.replace(/\\/g,'/');
    let files = fs.readdirSync(currentPath);
    for (let i in files) {
      let curFile = currentPath + files[i];
      let disFile = files[i];
      if (fs.statSync(curFile).isDirectory()) {
        if ((disFile.toUpperCase()!='INCOMING') && (disFile.toUpperCase()!='TEXTML') && (disFile.toUpperCase()!='ROUTING SLIP')  && (disFile.toUpperCase()!='RECOVERHERE') && (disFile.toUpperCase()!='RECYCLE BIN')) {
            console.log(curFile);
            hideIndex(curFile +'/', disFile,(disPath, filedis)=>{
              walkDir(disPath, filedis, ()=>{});
            });
        }
      }
      callboy();
    };
    hideIndex(dir, folder, (disPath, filedis)=>{
      walkDir(disPath, filedis, ()=>{
        console.log('finish');
      });
    });

  }
}
// hide .idxI and .idxD
function hideIndex(disPath, disFolder, callback) {
  if ((fs.existsSync(disPath + disFolder + '.idxI')) && (fs.existsSync(disPath + disFolder + '.idxD'))) {
    if ((!hidefile.isHiddenSync(disPath + disFolder + '.idxI')) && (!hidefile.isHiddenSync(disPath + disFolder + '.idxD'))) {
      let idx = hidefile.hideSync(disPath + disFolder + '.idxI'); let doc = hidefile.hideSync(disPath + disFolder + '.idxD');
       fs.unlink(disPath + disFolder + '.idxI', (err)=>{
         fs.renameSync(idx, disPath + disFolder + '.idxI');
          fs.unlink(disPath + disFolder + '.idxD', (err)=>{
           fs.renameSync(doc, disPath + disFolder + '.idxD');
           callback(disPath, disFolder);
         });
       });
   } else callback(disPath, disFolder);
  } else callback(disPath, disFolder);
}

let splitDr = drive.split('/');
scanreindex(drive, splitDr[1]);
