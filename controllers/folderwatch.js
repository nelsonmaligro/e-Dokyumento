const chokidar = require('chokidar');
const fs = require('fs');
const textract = require('textract');
const dochandle = require('./dochandle');
const dbhandle = require('./dbhandle');
const scanocr = require('./scanocr');
const wordextractor = require("word-extractor");
var toPdf = require("office-to-pdf")


var drive = "D:/drive/";
var extractor = new wordextractor();

// Initialize watcher.
const watcher = chokidar.watch('file, dir, glob, or array', {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  ignoreInitial: true,
  usePolling: true,
  interval: 2000,
  awaitWriteFinish: {
    stabilityThreshold: 3000,
    pollInterval: 2000
  },
  persistent: true
});
//var folder = 'n6a';
//var resPath = drive + folder;
watcher.add(drive);
// Something to use when events are received.
const log = console.log.bind(console);
var arrFileExt=['.pdf','.doc','.docx','.xls','.xlsx','.pptx','.ppt','.txt'];
// Add event listeners.
watcher
  .on('add', function(path){
    var folders = path.split('\\');var disFile = folders[folders.length - 1];var disFolder = folders[folders.length - 2];
    if ((disFile!=disFolder +'.idxD') && (disFile!=disFolder +'.idxI')){ //if not index file
      if ((arrFileExt.includes(getExtension(disFile))) && (disFile.substring(0,1)!='~')){
        var id = generateID();
          addeditDocu(id, path, disFolder, disFile, 'add', async function(disCont){
          var disFs = await fs.statSync(path);
          if (disCont.length > 2000) disCont = disCont.substring(0,2000);
          await addMetaDB(id, path, disFile, disFs.size, disFs.mtime, disCont, [disFolder], disFolder);
          log(`File ${path} has been added`);
        });
      }
    }
  })
  .on('change', function(path){
    var folders = path.split('\\');var disFile = folders[folders.length - 1];var disFolder = folders[folders.length - 2];
    if ((disFile!=disFolder +'.idxD') && (disFile!=disFolder +'.idxI')){ //if not index file
      if ((arrFileExt.includes(getExtension(disFile))) && (disFile.substring(0,1)!='~')){
          addeditDocu(0, path, disFolder, disFile, 'edit', function(id, disCont){
            var disFs = fs.statSync(path);
            if (disCont.length > 2000) disCont = disCont.substring(0,2000);
            editMetaDB(id, path, disFile, disFs.size, disFs.mtime, disCont, [disFolder], disFolder);
            log(`File ${path} has been changed`);
        });
      }
    }

  })
  .on('unlink', function(path){
    var folders = path.split('\\');var disFile = folders[folders.length - 1];var disFolder = folders[folders.length - 2];
    if ((disFile!=disFolder +'.idxD') && (disFile!=disFolder +'.idxI')){ //if not index file
      delDocu(path.substr(0,path.length-disFile.length), disFolder, disFile);
      delMetaDB(disFile);
      log(`File ${path} has been deleted`);
    }
  });

// More possible events.
watcher
  .on('addDir', path => log(`Directory ${path} has been added`))
  .on('unlinkDir', path => log(`Directory ${path} has been removed`))
  .on('error', error => log(`Watcher error: ${error}`))
  .on('ready', () => log('Initial scan complete. Ready for changes'));
  //.on('raw', (event, path, details) => { // internal
  //log('Raw event info:', event, path, details);
  // });

//Add metadata to database
async function addMetaDB(disId, path, disFile, fsSize, fsDeyt, disCont, disTag, disFolder){
  await dbhandle.docCreate(disId, disFile, path, disFolder, "System", disTag, fsDeyt, fsSize, disCont);
};
//Edit metadata from database
async function editMetaDB(disId, path, disFile, fsSize, fsDeyt, disCont, disTag, disFolder){
  await dbhandle.docEdit(disId, disFile, path, disFolder, "System", disTag, fsDeyt, fsSize, disCont);
};
//delete metadata from database
async function delMetaDB(disFile){
  await dbhandle.docDel(disFile);
};
//Add Document
async function delDocu(path, disFolder, disFile){
      await dochandle.delDocu(path, disFolder +'.idxD', disFolder +'.idxI', disFile, disFolder);
};
//Add Document
async function addeditDocu(disId, path, disFolder, disFile, flg, callback){
    //sanitize file content
    var disContent = "";
    switch(getExtension(disFile))
    {
      case '.doc':
            var extracted = extractor.extract(path);
            extracted.then(async function(doc) {
              if (doc===null) {disContent ='No Content. File Corrupted';}
              else {disContent = await doc.getBody().replace(/[\r\n\t]+/gm,' ');}
              disDocHandle(disContent, disId, path, disFolder, disFile, flg, function (id){
                if (flg==='add') callback(disContent);
                else callback(id, disContent);
              });

            }).catch(async function(err){
              disContent= 'No Content. File Corrupted';
              disDocHandle(disContent, disId, path, disFolder, disFile, flg, function (id){
                if (flg==='add') callback(disContent);
                else  callback(id, disContent);
              });

            });
            break;
      case '.ppt':
          var wordBuffer = fs.readFileSync(path);
          toPdf(wordBuffer).then(
            (pdfBuffer) => {
              fs.writeFileSync(path + '.pdf', pdfBuffer);
            }, (err) => {
              console.log(err);
            });
        break;
      default:
        await textract.fromFileWithPath(path, async function(err,text){
          //if scanned pdf ....OCR this
          disContent = await text;
          if (disContent === null) disContent = "No Content. Corrupted.";
          if ((disContent.length < 1000) && (getExtension(disFile)==='.pdf')){
            scanocr.outtext(path, async function(data){
              disContent = data.replace(/[\r\n\t]+/gm,' ');
              disDocHandle(disContent, disId, path, disFolder, disFile, flg, function(id){
                if (flg==='add') callback(disContent);
                else callback(id, disContent);
              });

            });
          } else {
            var id = disDocHandle(disContent, disId, path, disFolder, disFile, flg, function(id){
              if (flg==='add') callback(disContent);
              else callback(id, disContent);
            });

          }
        });
    }
  };

//Add and Update document into index
async function disDocHandle(disContent, disId, path, disFolder, disFile, flg, callback){
  if (disContent.length > 3000) disContent = disContent.substring(0,3000);
  if (flg==='add'){
    dochandle.addDocu(disId, path.substr(0,path.length-disFile.length), disFolder +'.idxD', disFolder +'.idxI', disContent, disFile, disFolder);
    callback(disContent);
  } else {
      dochandle.editDocu(path.substr(0,path.length-disFile.length), disFolder +'.idxD', disFolder +'.idxI', disContent, disFile, disFolder, async function(id){
      callback(id);
    });
  }
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
