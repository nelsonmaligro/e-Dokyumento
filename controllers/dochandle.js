/*
Helper Modules for indexing documents


@module multiple modules in handling document indexing
@author Nelson Maligro
@copyright 2020
@license GPL
*/

var flexsearch = require("flexsearch");
var storage = require('dom-storage');
const promisify = require('util').promisify;
var fs = require('fs');
var path = require('path');
const toPdf = require("office-to-pdf");
const utilsdocms = require('./utilsdocms');


//convert office document to PDF
exports.convDoctoPDF = function(Src, Dst, callback) {
  var wordBuffer = fs.readFileSync(Src);
  toPdf(wordBuffer).then(
    (pdfBuffer) => {
      //console.log('in');
      fs.writeFileSync(Dst, pdfBuffer);
      callback();
    }, (err) => {
      console.log(err);
      return;
    });
};
//function to get the file extension
exports.getExtension = function getExtension(filename) {
  if (filename.length == 0)
    return "";
  var dot = filename.lastIndexOf(".");
  if (dot == -1)
    return "";
  var extension = filename.substr(dot, filename.length);
  return extension;
};
//Collection of Index
var collIndex = [];

//Convert Document into PDF


//function Async import storage
function storageImp(localStorage, serBool, value, index, boolDoc) {
  return new Promise((resolve, reject) => {
    index.import(localStorage.getItem(value.toUpperCase()), {
      serialize: false,
      index: serBool,
      doc: boolDoc
    });
    resolve(index);
  }).catch((err) => {});
}

//function Async export storage
function storageExp(localStorage, serBool, value, index, boolDoc, callback) {
  new Promise((resolve, reject) => {
    localStorage.clear();
    localStorage.setItem(value.toUpperCase(), index.export({
      serialize: false,
      index: serBool,
      doc: boolDoc
    }));
    resolve();
  }).then(() => {
    callback();
  }).catch((err) => {})
}
//Create index file and add to array
function updCollIdx(Path, FilIdx, FilDoc, Folder, callback) {
  //shift some index to save memory
  while (collIndex.length > 10) {
    collIndex.shift();
  }
  //initialize storage and Schema
  var localstoreIDX = new storage(Path + FilIdx, {
    strict: false,
    ws: '  '
  });
  var localstoreDOC = new storage(Path + FilDoc, {
    strict: false,
    ws: '  '
  });

  new Promise((resolve, reject) => {
    let result = collIndex.find(idx => idx.name === Path);
    resolve(result);
  }).then((result) => {
    if (result) return callback(result.index);
    else {
      new Promise((resolve, reject) => {
        let n6Index = new flexsearch('default', {
          tokenize: "forward",
          resolution: 9,
          //tokenize: "strict",
          encode: "icase",
          //async: true,
          worker: 4,
          threshold: 0,
          depth: 3,
          suggest: false,
          //threshold: 8,
          //depth: 2,
          doc: {
            id: "id",
            field: [
              "title",
              "content"
            ]
          }
        });
        resolve(n6Index);
      }).then((n6Index) => {
        if ((fs.existsSync(Path + FilIdx)) && (fs.existsSync(Path + FilDoc))) {
          //Import Index and Doc File............Async reading DB index with Promise
          storageImp(localstoreIDX, true, Folder, n6Index, false).then((n6Index) => {
            storageImp(localstoreDOC, false, Folder, n6Index, true).then((n6Index) => {
              collIndex.push({
                name: Path,
                index: n6Index
              });
              callback(n6Index);
            }).catch((err) => {});
          }).catch((err) => {});
        } else {
          collIndex.push({
            name: Path,
            index: n6Index
          });
          callback(n6Index);
        }
      }).catch((err) => {})

    }
  }).catch((err) => {});

}

function updateCollIndex(Path, n6Index) {
  //await n6Index.remove(parseInt(found.id),10);
  new Promise((resolve, reject) => {
    let result = collIndex.findIndex(idx => idx.name === Path);
    resolve(result);
  }).then((result) => {
    if (result) collIndex[result].index = n6Index;
  }).catch((err) => {});

}

//Delete document from index
exports.delDocu = function delDocu(Path, FilDoc, FilIdx, Title, Folder) {
  //initialize storage and Schema
  var localstoreIDX = new storage(Path + FilIdx, {
    strict: false,
    ws: '  '
  });
  var localstoreDOC = new storage(Path + FilDoc, {
    strict: false,
    ws: '  '
  });
  //If index file exist
  updCollIdx(Path, FilIdx, FilDoc, Folder, function(n6Index) {
    new Promise((resolve, reject) => {
      let found = n6Index.find({
        title: Title
      });
      resolve(found);
    }).then((found) => {
      if (found) {
        n6Index.remove(found);
        console.log('index found and deleted')
        //Update collection of index.
        updateCollIndex(Path, n6Index)
        storageExp(localstoreIDX, true, Folder, n6Index, false, function() {
          storageExp(localstoreDOC, false, Folder, n6Index, true, function() {});
        });
      }
    }).catch((err) => {});

  });
};

//edit Document from the index file
exports.findTitle = function(Path, FilDoc, FilIdx, Folder, Title, callback) {
  updCollIdx(Path, FilIdx, FilDoc, Folder, function(n6Index) {
    let found = n6Index.find({
      title: Title
    });
    updateCollIndex(Path, n6Index);
    callback(found);
  });
}
//edit Document from the index file
exports.getAllTitle = function(Path, FilDoc, FilIdx, Folder, callback) {

  updCollIdx(Path, FilIdx, FilDoc, Folder, function(n6Index) {
    let arrTitle = [];
    let found = n6Index.where({});
    found.forEach((item) => {
      arrTitle.push(item.title);
    });
    updateCollIndex(Path, n6Index);
    callback(arrTitle);
  });
}
exports.addeditDocu = function addeditDocu(disID, Path, FilDoc, FilIdx, disContent, Title, Folder, callback) {
  //initialize storage and Schema
  var localstoreIDX = new storage(Path + FilIdx, {
    strict: false,
    ws: '  '
  });
  var localstoreDOC = new storage(Path + FilDoc, {
    strict: false,
    ws: '  '
  });
  //If index file exist
  updCollIdx(Path, FilIdx, FilDoc, Folder, function(n6Index) {
    //Edit index
    new Promise((resolve, reject) => {
      let found = n6Index.find({
        title: Title
      });
      resolve(found);
    }).then((found) => {
      if (found) {
        let doc = [{
          id: found.id,
          title: Title,
          content: disContent
        }];
        disID = found.id;
        n6Index.update(doc);
      } else {
        var doc = [{
          id: disID,
          title: Title,
          content: disContent
        }];
        n6Index.add(doc);
      }
      //Update collection of index.
      updateCollIndex(Path, n6Index);
      //Save to index and doc file......Async writing DB index with Async/await
      storageExp(localstoreIDX, true, Folder, n6Index, false, function() {
        storageExp(localstoreDOC, false, Folder, n6Index, true, function() {
          callback(disID);
        });
      });
    }).catch((err) => {});
  });
};

//find string from index path
exports.findDoc = function(Path, FilDoc, FilIdx, Folder, Query, callback) {
  //initialize storage and Schema
  var localstoreIDX = new storage(Path + FilIdx, {
    strict: false,
    ws: '  '
  });
  var localstoreDOC = new storage(Path + FilDoc, {
    strict: false,
    ws: '  '
  });
  updCollIdx(Path, FilIdx, FilDoc, Folder, function(n6Index) {
    n6Index.search(Query, function(result) {
      callback(result);
    });
  });
};
//Delay Function
function waitforme(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
//recursively search through directories
exports.findDocFromDir = function(query, dir, folder, id, callback) {
  collIndex = [];
  let searchResult = new Array;
  let idxDType = ['.idxD'];
  let idxIType = ['.idxI'];
  let bolOutres = false;
  searchResult.push({
    id: 0,
    title: 'X',
    content: 'XXXXXXXXXXX',
    path: ''
  });
  let bolOutFin = false;

  async function walkDir(currentPath, disFolder, callboy) {

    currentPath = currentPath.replace(/\\/g, '/');
    let localstoreDOC = null;
    let localstoreIDX = null;
    let filIdx = null;
    let filDoc = null; //let directories = [];
    let files = fs.readdirSync(currentPath);
    let disTime = setTimeout(() => {
      if ((!bolOutres)) {
        callboy(searchResult, true);
        bolOutres = true;
      }
    }, 10000);

    for (let i in files) {
      await waitforme(100);
      let curFile = currentPath + files[i];
      try {
        if ((fs.statSync(curFile).isFile()) && (idxDType.indexOf(path.extname(curFile)) != -1)) {
          localstoreDOC = new storage(curFile, {
            strict: false,
            ws: '  '
          });
          filDoc = files[i];
        } else if ((fs.statSync(curFile).isFile()) && (idxIType.indexOf(path.extname(curFile)) != -1)) {
          localstoreIDX = new storage(curFile, {
            strict: false,
            ws: '  '
          });
          filIdx = files[i];
        } else if (fs.statSync(curFile).isDirectory()) {
          if ((files[i].toUpperCase() != 'INCOMING') && (files[i].toUpperCase() != 'TEXTML') && (files[i].toUpperCase() != 'ROUTING SLIP') && (files[i].toUpperCase() != 'RECOVERHERE') && (files[i].toUpperCase() != 'RECYCLE BIN')) {
            walkDir(curFile + '/', files[i], (searchRes, bolFrst) => {
              if ((searchResult.length >= 10) && (!bolOutres)) {
                callboy(searchResult, true);
                bolOutres = true;
              }
            });
          }
        }
      } catch (err) {}
    }
    if ((localstoreDOC != null) && (localstoreIDX != null)) {
      updCollIdx(currentPath, filIdx, filDoc, disFolder, function(n6Index) {
        n6Index.search(query, function(result) {
          if (result.length > 0) {
            result.forEach((item) => {
              if ((item != undefined) && (item != null)) searchResult.push({
                id: item.id,
                title: item.title,
                content: item.content,
                path: currentPath
              });
            });
            //remove index in the collection to prevent RAM Exhaustion
            collIndex = collIndex.filter(function(item) {
              return item.name == currentPath;
            });
          }
          //clear DOM local storage to free up space
          localstoreDOC.clear();
          localstoreIDX.clear();
          localstoreDOC = null;
          localstoreIDX = null;
          if (searchResult.length > 1) {
            let index = global.allSearches.findIndex(srcitems => srcitems.user === id);
            if (index != -1) global.allSearches.splice(index, 1);
            searchResult.forEach((items, idx) => {
              let first = items.content.toUpperCase().indexOf(query.toUpperCase());
              let last = first;
              if ((first - 300) < 0) first = 0;
              else first = first - 300;
              if ((last + 300) > items.content.length - 1) last = items.content.length - 1;
              else last = last + 300;
              let sidx = global.allSearches.findIndex(srcitems => srcitems.user === id);
              if (sidx == -1) global.allSearches.push({
                user: id,
                query: query,
                search: [{
                  filename: items.path + items.title,
                  content: items.content.substring(first, last)
                }]
              });
              else global.allSearches[sidx].search.push({
                filename: items.path + items.title,
                content: items.content.substring(first, last)
              });
            });
          }
          if ((searchResult.length >= 10) && (!bolOutres)) {
            callboy(searchResult, true);
            bolOutres = true;
          }
        });
      });
    }
  };

  walkDir(dir, folder, (searchRes, bolFirst) => {
    if ((!bolOutFin) && (!bolFirst)) callback(searchRes, true);
    else callback(searchRes, bolFirst);

    searchResult = [];
    bolOutFin = true;
  });

}
