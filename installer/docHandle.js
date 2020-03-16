var flexsearch = require("flexsearch");
var storage = require('dom-storage');
const promisify = require('util').promisify;
var fs = require('fs');
var sw = require('stopword');

//Schema
var n6Index = new flexsearch('speed',{
  tokenize: "strict",
  encode: "icase",
  //async: true,
  worker: 4,
  threshold: 7,
  depth: 2,
  doc: {
    id:"id",
    field: [
      "title",
      "content"
    ]
  }
});
//function generate unique numeric // ID
function generateID(callback){
  var dateVal = Date.now().toString();
  var randomVal = (Math.floor(Math.random() * Math.floor(5))).toString();
  var id = Math.floor(dateVal+randomVal);
  return callback(id);
};

//function Async import storage
function storageImp(localStorage, serBool, value, index, boolDoc, callback){
  index.import(localStorage.getItem(value),{serialize: false, index: serBool, doc:boolDoc});
  return callback();
}

//function Async export storage
async function storageExp(localStorage, serBool, value, index, boolDoc){
  await localStorage.setItem(value,index.export({serialize: false, index: serBool, doc:boolDoc}));

}



//initialize storage
var localstoreIDX = new storage('./Feeds_Idx_2020.db', { strict: false, ws: '  ' });
var localstoreDOC = new storage('./Feeds_Doc_2020.db', { strict: false, ws: '  ' });

//Save to index file
var regExpr = /[^a-zA-Z0-9-. ]/g;
var fileContent1 = fs.readFileSync('./sample1.txt','utf-8').replace(regExpr,'').split(' ');
var disContent1 = sw.removeStopwords(fileContent1);
    disContent1 = [...new Set(disContent1)];
    disContent1 = disContent1.join(' ');


//var disContent = fs.readFileSync('./sample.txt','utf-8');
var docsinit =[{
      id:1001,
      title:'Sample Doc 1',
      content:'The quick brown fox jumps over the lazy dog on every corner of the house'
    }, {
          id:1002,
          title:'Sample Doc 2',
          content:disContent1
        }, {
              id:1003,
              title:'Sample Doc 3',
              content:'The what?'
            }, {
                  id:15830610345442,
                  title:'Sample Doc 4',
                  content:'The kusog quick brown fox jumps over the lazy dog on every corner of the house'
                }];
//Add to index
 //n6Index.add(docsinit);
 //storageExp(localstoreIDX,true,'feeds_2020',n6Index, false);
 //storageExp(localstoreDOC,false,'feeds_2020',n6Index, true);


//Async reading DB index with Promise
var storeImp = promisify(storageImp);
storeImp(localstoreIDX, true, "feeds_2020", n6Index, false).then(function() {
  //Sample documents
  generateID(function(id){
    var docs =[{
          id:id,
          title:'Sample Doc 5',
          content:'The man who sold the world!'
        }];
    storeImp(localstoreDOC, false, "feeds_2020", n6Index, true).then(function() {
      //Add to index
      n6Index.add(docs);
      //Async writing DB index with Async/await
      storageExp(localstoreIDX,true,'feeds_2020',n6Index, false);
      storageExp(localstoreDOC,false,'feeds_2020',n6Index, true);

      //search index
      //n6Index.search("fox", function(results){
      //  console.log(results);
      //});
    });


  });
}).catch((error)=>{
  console.log(error);
});
