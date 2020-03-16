var flexsearch = require("flexsearch");
var storage = require('dom-storage');
const promisify = require('util').promisify;
var fs = require('fs');



//Collection of Index
var collIndex = [];


//function Async import storage
async function storageImp(localStorage, serBool, value, index, boolDoc){
  await index.import(localStorage.getItem(value),{serialize: false, index: serBool, doc:boolDoc});
}

//function Async export storage
function storageExp(localStorage, serBool, value, index, boolDoc, callback){
  localStorage.clear();
  localStorage.setItem(value,index.export({serialize: false, index: serBool, doc:boolDoc}));
  callback();
}
//Create index file and add to array
async function updCollIdx(Path, FilIdx, FilDoc, Folder, callback){
  //initialize storage and Schema
  var localstoreIDX = new storage(Path + FilIdx, { strict: false, ws: '  ' });
  var localstoreDOC = new storage(Path + FilDoc, { strict: false, ws: '  ' });

  var result = await collIndex.find(idx=>idx.name===Path);
    if (result!=null){
      callback(result.index);
    } else {
      var n6Index = await new flexsearch('speed',{
        tokenize: "strict",
        encode: "icase",
        //async: true,
        worker: 4,
        threshold: 8,
        depth: 2,
        doc: {
          id:"id",
          field: [
            "title",
            "content"
          ]
        }
      });
      if ((fs.existsSync(Path + FilIdx)) && (fs.existsSync(Path + FilDoc))){
        //Import Index and Doc File............Async reading DB index with Promise
         storageImp(localstoreIDX, true, Folder, n6Index, false);
         storageImp(localstoreDOC, false, Folder, n6Index, true);
      }
      collIndex.push({name:Path, index:n6Index})
      callback(n6Index);
    }
}

async function updateCollIndex(Path, n6Index){
  //await n6Index.remove(parseInt(found.id),10);
  var result = await collIndex.findIndex(idx=>idx.name===Path);
  if (result!= null){
      collIndex[result].index = n6Index;
  }
}

//Delete document from index
exports.delDocu = function delDocu(Path, FilDoc, FilIdx, Title, Folder){
  //initialize storage and Schema
  var localstoreIDX = new storage(Path + FilIdx, { strict: false, ws: '  ' });
  var localstoreDOC = new storage(Path + FilDoc, { strict: false, ws: '  ' });
  //If index file exist
    updCollIdx(Path, FilIdx, FilDoc,  Folder, function(n6Index){
    var found = n6Index.find({title:Title});
    if (found != null){
      //removeIndex(n6Index, found);
      n6Index.remove(found);
      //Update collection of index.
      updateCollIndex(Path, n6Index)

      //Save to index and doc file......Async writing DB index with Async/await
      //console.log(n6Index);
        storageExp(localstoreIDX,true,Folder,n6Index, false, function(){
            storageExp(localstoreDOC,false,Folder,n6Index, true, function(){});
        });

      }
  });
};
//Add Document to the index
exports.addDocu = function addDocu(id, Path, FilDoc, FilIdx, disContent, Title, Folder) {
  //initialize storage and Schema
  var localstoreIDX = new storage(Path + FilIdx, { strict: false, ws: '  ' });
  var localstoreDOC = new storage(Path + FilDoc, { strict: false, ws: '  ' });
  //Prepare index and doc..Generate unique numeric ID
    var doc =[{
          id:id,
          title:Title,
          content:disContent
        }];
  //If index file exist
  updCollIdx(Path, FilIdx, FilDoc, Folder, function(n6Index){
    //Add to index
    var found = n6Index.find({title:Title});
    if (found==null) {
      n6Index.add(doc);
      //Update collection of index.
      updateCollIndex(Path, n6Index);
       //Save to index and doc file......Async writing DB index with Async/await
       storageExp(localstoreIDX,true,Folder,n6Index, false, function(){
           storageExp(localstoreDOC,false,Folder,n6Index, true, function(){});
       });
    }
  });
};

//edit Document from the index file
exports.editDocu = async function editDocu(Path, FilDoc, FilIdx, disContent, Title, Folder, callback) {
  //initialize storage and Schema
  var localstoreIDX = new storage(Path + FilIdx, { strict: false, ws: '  ' });
  var localstoreDOC = new storage(Path + FilDoc, { strict: false, ws: '  ' });
  var disID = '0';
  //If index file exist
  updCollIdx(Path, FilIdx, FilDoc, Folder, function(n6Index){
    //Edit index

    var found = n6Index.find({title:Title});
    if (found!=null) {
      //Prepare index and doc..Generate unique numeric ID
        var doc =[{
              id:found.id,
              title:Title,
              content:disContent
            }];
      disID = found.id;
      n6Index.update(doc);
      //Update collection of index.
      updateCollIndex(Path, n6Index);
       //Save to index and doc file......Async writing DB index with Async/await
       storageExp(localstoreIDX,true,Folder,n6Index, false, function(){
           storageExp(localstoreDOC,false,Folder,n6Index, true, function(){
              callback(disID);
           });
       });
    }else{callback(disID);}

  });

};
