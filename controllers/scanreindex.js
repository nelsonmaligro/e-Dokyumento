const fs = require('fs');
const dochandle = require('./dochandle');
const dbhandle = require('./dbhandle');
//const utilsdocms = require('./utilsdocms');
var abspath = require('path');
const textract = require('textract');
const wordextractor = require("word-extractor");
var toPdf = require("office-to-pdf");
const scanocr = require('./scanocr');

var extractor = new wordextractor();
var classModel = dbhandle.disModel('class');
var tagModel = dbhandle.disModel('tag');
var brModel = dbhandle.disModel('branch')
var drive = "D:/Drive/";

var docClass = []; var docTag = []; var docBr = [];
dbhandle.generateList(classModel, function (res){ docClass = res; });
dbhandle.generateList(tagModel, function (res){ docTag = res; });
dbhandle.generateList(brModel, function (res){ docBr = res; });
var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
var arrFileExt=['.pdf','.doc','.docx','.pptx','.txt'];
var flag = true; var countConv = 0;
dbhandle.settingDis((setting)=>{
  drive = setting.maindrive;
  function scanreindex(dir, folder, callback){
    let idxDType = ['.idxD']; let idxIType = ['.idxI'];let bolOutres = false;
    function walkDir(currentPath, disFolder, callboy) {
      currentPath = currentPath.replace(/\\/g,'/');
      let folders = currentPath.split('/');let parentFolder = '';
      if ((months.includes(disFolder)) && (folders.length > 3)) parentFolder = folders[folders.length - 4];
      else if (folders.length > 2) parentFolder = folders[folders.length - 3];
      let files = fs.readdirSync(currentPath);

      for (let i in files) {
        let curFile = currentPath + files[i];
        disFile = files[i];
        if (fs.statSync(curFile).isFile()) {
          if ((disFile!=disFolder +'.idxD') && (disFile!=disFolder +'.idxI')){ //if not index file
            if ((arrFileExt.includes(getExtension(disFile))) && (disFile.substring(0,1)!='~') && (disFile.substring(0,6).toLowerCase()!='route-')){
              findTitle(currentPath, disFile, disFolder +'.idxD', disFolder +'.idxI', disFolder, curFile, parentFolder, (found, disFileO, curFileO, disFolderO, parentFolderO)=>{
                //console.log(found);
                if (!found) {
                  //console.log(curFileO);
                  let mainId = generateID();++countConv; //console.log(curFileO, countConv);
                    addeditDocu(mainId, curFileO, disFolderO, disFileO, parentFolderO, function (idX, disContX, discurFileX, outFolderX, outParentX) {
                      let splitFile = discurFileX.split('/');
                      let newdisFile = splitFile[splitFile.length-1];
                      let disFs = fs.statSync(discurFileX);
                      if (disContX.length > 2000) disContX = disContX.substring(0,2000);
                      editMetaDB(idX, discurFileX, newdisFile, disFs.size, disFs.mtime, disContX, outFolderX, outParentX);
                      --countConv;//console.log(discurFileX,countConv);
                  });
                }
              });
            }
          }
        } else if (fs.statSync(curFile).isDirectory()) {
          if ((disFile.toUpperCase()!='INCOMING') && (disFile.toUpperCase()!='TEXTML') && (disFile.toUpperCase()!='ROUTING SLIP')  && (disFile.toUpperCase()!='RECOVERHERE') && (disFile.toUpperCase()!='RECYCLE BIN')) {
               new Promise ((resolve, reject)=>{
               let arrFiles = getFiles(curFile +'/'); let newArrs = [];
               arrFiles.forEach((item) => {
                 newArrs.push(curFile +'/'+item);
               });
               //check the DB if files exist in the directory
               dbhandle.getFilesbyDir(curFile +'/',(allFile)=>{
                 allFile.forEach((item) => {
                     if (!newArrs.toString().toUpperCase().includes(item.filename.toUpperCase())) {
                       console.log(item.filename);
                       dbhandle.docDel(item.filename,()=>{});
                   }
                 });
                 //check index file (idxI and idxD) if file exist
                 dochandle.getAllTitle(curFile +'/', files[i] + '.idxD', files[i] + '.idxI', files[i], (arrRes)=>{
                   if (arrRes.length > 0){
                     arrRes.forEach((item)=>{
                       if (!arrFiles.includes(item)) dochandle.delDocu(curFile +'/', files[i] + '.idxD', files[i] + '.idxI', item, files[i]);
                     });
                   }
                 });
                 resolve();
              });
             }).then(()=>{
               if (countConv > 0) flag = false;
               else flag = true;

               waitFor(() => flag === true)
               .then(() => {console.log(countConv, curFile +'/', files[i]);walkDir(curFile +'/', files[i], ()=>{}); });
              //   checkFlag(curFile +'/', files[i]);
             }).catch((err)=>{});
          }

        }
      }
      function waitFor(conditionFunction) {
        const poll = resolve => {
          if (countConv > 0) flag = false;
          else flag = true;
          if(conditionFunction()) resolve();
          else setTimeout(() => poll(resolve), 10000);
        }
        return new Promise(poll);
      }

      callboy();
    };

    new Promise ((resolve, reject)=>{
      let arrFilex = getFiles(dir); let newArr = [];
      arrFilex.forEach((item) => {
        newArr.push(dir+item);
      });
      dbhandle.getFilesbyDir(dir,(allFiles)=>{
        //console.log(allFiles);
         //check the DB if files exist in the directory
        allFiles.forEach((disitem) => {
          if (!newArr.toString().toUpperCase().includes(disitem.filename.toUpperCase())) {
              console.log(disitem.filename);
              dbhandle.docDel(disitem.filename,()=>{});
          }
        });
        //check index file (idxI and idxD) if file exist
        dochandle.getAllTitle(dir, folder + '.idxD', folder + '.idxI', folder, (arrRes)=>{
         if (arrRes.length > 0) {
           arrRes.forEach((item)=>{
               if (!arrFilex.includes(item)) dochandle.delDocu(dir, folder + '.idxD', folder + '.idxI', item, folder);
           });
         }
      });
        resolve();
     });
    }).then(()=>{
         walkDir(dir, folder, ()=>{
         console.log('finish');
       });
    }).catch((err)=>{});

  }

  //find title in index files
  function findTitle(currentPath, disFile, FilDoc, FilIdx, disFolder, curFile, parentFolder, callback) {
    dochandle.findTitle (currentPath, FilDoc, FilIdx, disFolder, disFile, (found)=>{
      callback (found, disFile, curFile, disFolder, parentFolder);
    });
  }
  //Edit metadata from database
  function editMetaDB(disId, path, disFile, fsSize, fsDeyt, disCont, disFolder, parentFolder){
    dbhandle.generateList(tagModel, function (res){ docTag = res; });
    path = path.replace(/\\/g,'/');
    dbhandle.docFindbyId(disId, function (result) {
        if (!result) {
          dbhandle.docFind(path, (docFound)=>{
            if (docFound)  dbhandle.docUpdateId(disId,path);
            else {
              if (!months.includes(disFolder)){
                if (!docClass.includes(disFolder)){
                  if (parentFolder.toUpperCase()=='TAGS'){
                    dbhandle.docCreate(disId, disFile, path, '', "System", [disFolder], fsDeyt, fsSize, disCont,'',[],[],[]);
                    UpdateTag(docTag, disFolder);
                  } else dbhandle.docCreate(disId, disFile, path, '', "System", [], fsDeyt, fsSize, disCont,'',[],[],[]);
                } else dbhandle.docCreate(disId, disFile, path, disFolder, "System", [], fsDeyt, fsSize, disCont,'',[],[],[]);
              } else {
                   if (docClass.includes(parentFolder)) dbhandle.docCreate(disId, disFile, path, parentFolder, "System", [], fsDeyt, fsSize, disCont,'',[],[],[]);
                  else dbhandle.docCreate(disId, disFile, path, '', "System", [], fsDeyt, fsSize, disCont,'',[],[],[]);
              }
            }
          });
        } else dbhandle.docEditWatch(disId, disFile, path, fsDeyt, fsSize, disCont);
    });

  };
  //Add Document
  async function addeditDocu(disId, path, disFolder, disFile, parentFolder, callback){
      //sanitize file content
      var disContent = "";
      switch(getExtension(disFile))
      {
        case '.doc':
              var extracted = extractor.extract(path);
              extracted.then(async function(doc) {
                if (doc===null) {disContent ='No Content. File Corrupted';}
                else {disContent = await doc.getBody().replace(/[\r\n\t]+/gm,' ');}
                disDocHandle(disContent, disId, path, disFolder, disFile, parentFolder, function (id, newCont, outPath, outFolder, outParent){
                  callback(id, newCont, outPath, outFolder, outParent);
                });

              }).catch(async function(err){
                disContent= 'No Content. File Corrupted';
                disDocHandle(disContent, disId, path, disFolder, disFile, parentFolder, function (id, newCont, outPath, outFolder, outParent){
                  callback(id, newCont, outPath, outFolder, outParent);
                });

              });
              break;
        /*case '.ppt':
            var wordBuffer = fs.readFileSync(path);
            toPdf(wordBuffer).then(
              (pdfBuffer) => {
                fs.writeFileSync(path + '.pdf', pdfBuffer);
              }, (err) => {
                console.log(err);
              });
          break;*/
        default:
          await textract.fromFileWithPath(path, async function(err,text){
            //if scanned pdf ....OCR this
            disContent = await text;
            if (disContent === null) disContent = "No Content. Corrupted.";
            if ((disContent.length < 1000) && (getExtension(disFile)==='.pdf')){
              scanocr.outtext(path, async function(data){
                disContent = data.replace(/[\r\n\t]+/gm,' ');
                disDocHandle(disContent, disId, path, disFolder, disFile, parentFolder, function (id, newCont, outPath, outFolder, outParent){
                  callback(id, newCont, outPath, outFolder, outParent);
                });
              });
            } else {
              disDocHandle(disContent, disId, path, disFolder, disFile, parentFolder, function (id, newCont, outPath, outFolder, outParent){
                callback(id, newCont, outPath, outFolder, outParent);
              });

            }
          });
      }
    };

  //Add and Update document into index
  function disDocHandle(disContent, disId, path, disFolder, disFile, parentFolder, callback){
    if (disContent.length > 5000) disContent = disContent.substring(0,5000);
      dochandle.addeditDocu(disId, path.substr(0,path.length-disFile.length), disFolder +'.idxD', disFolder +'.idxI', disContent, disFile, disFolder, async function(id){
        callback(id, disContent, path, disFolder, parentFolder);
      });
  };
  //function generate unique numeric // ID
  function generateID(){
    var dateVal = Date.now().toString();
    var randomVal = (Math.floor(Math.random() * Math.floor(9))).toString();
    var id = Math.floor(dateVal+randomVal);
    return id;
  };
  //function to get the file extension
  function getExtension(filename) {
      if (filename.length == 0)
          return "";
      var dot = filename.lastIndexOf(".");
      if (dot == -1)
          return "";
      var extension = filename.substr(dot, filename.length);
      return extension;
  };

  //process additional hashtags
  function UpdateTag (docTag, tag){
    if (!docTag.includes(tag)){
      dbhandle.addList(tagModel,tag);
    }
  }
  //read files function
  function getFiles (path){
    var newpath = path;
    if (path.substring(path.length-1)!="/") newpath = path + "/";
    return fs.readdirSync(newpath).filter(function (file){
      try{
          return fs.statSync(newpath+file).isFile();
      } catch {}

    });
  }

  //let args = process.argv;
  //console.log(args[2], args[3]);

  setTimeout(()=>{
    let splitDr = drive.split('/');
    scanreindex(drive, splitDr[1]);
  },10000);

});
