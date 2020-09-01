/*
Helper Modules for Handling Mongo Database

@module multiple modules involving Database Operations
@author Nelson Maligro
@copyright 2020
@license GPL
*/

const mongoose = require('mongoose');
const {Schema} = mongoose;
const hash = require('jshashes');
const crypto = require('crypto');


//Get the default connection
mongoose.connect('mongodb://127.0.0.1/docMS', { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//Dcoument Schema
const docSchema = new Schema({
  id:String,
  title: String,
  filename: String,
  category: String,
  projects: [],
  author: String,
  deyt: Date,
  size: Number,
  content: String,
  routeslip: String,
  reference: [],
  enclosure: [],
  reference: [],
  comment: [],
});
//User Accounts DB
const userSchema = new Schema({
  userN: String,
  hashP: String,
  email: String,
  salt: String,
  group:String,
  level: String,
  path: String,
  mailfiles:[],
});
//Monitoring DB
const monitorSchema = new Schema({
  title: String,
  filename: String,
  filepath: String,
  route:[{
        deyt: String,
        branch: [],
      }],
});
//Monitoring DB
const tempmonitorSchema = new Schema({
  title: String,
  filename: String,
  filepath: String,
  route:[{
        deyt: String,
        branch: [],
      }],
});
//server settings
const settingSchema = new Schema({
  server:String,
  maindrive: String,
  publicdrive: String,
  publicstr: String,
  ai:String,
  topmgmt:String,
});
//count logs of all commo
const commologsSchema = new Schema({
  year: String,
  month: String,
  branch: String,
  count: Number,
});
//activity logs
const activitylogsSchema = new Schema({
  user: String,
  deyt: Date,
  action: String,
  doc: String,
  serial: String,
});

//compile model from schema
var docModel = new mongoose.model('pnDocs',docSchema);
var userModel = new mongoose.model('userAccs',userSchema);
var monitorModel = new mongoose.model('monitorAccs',monitorSchema);
var tempmonitorModel = new mongoose.model('tempmonitorAccs',tempmonitorSchema);
var settingModel = new mongoose.model('settings',settingSchema);
var commologsModel = new mongoose.model('commologs',commologsSchema);
var activitylogsModel = new mongoose.model('activitylogs',activitylogsSchema);

//var branchModel = new mongoose.model('branch',new Schema({name: String}));
//var classModel = new mongoose.model('class',new Schema({name: String}));

exports.disModel = function(collName){
  return mongoose.model(collName,new Schema ({name:String}));
};
//create List
exports.createList = function createList(disModel, title){
  newModel = new disModel({name:title});
  newModel.save();
};
//Find Lists

exports.findList = function findList(disModel, title, callback){
  var ret = 'Found';
  disModel.findOne({name:{'$regex':'^'+title+'$','$options':'i'}}, function (err, res){
    if (!res) ret = 'Not Found';
    callback(ret);
  });
};
//Enumerate Lists
exports.generateList = function generateList(disModel,callback){
  //find file
  disModel.find(function (err, res){

    var lists = [];
    try{
      res.forEach (function (names){
        lists.push(names.name);
      });
    } catch{}

    callback(lists);
  });
};
//Add to Lists
exports.addList = function addList(disModel, title){
  //find file
  disModel.findOne({name:{'$regex':'^'+title+'$','$options':'i'}}, function (err, res){
    if (!res){
      newModel = new disModel({name:title});
      newModel.save();
    }
  });
};
//Add to Lists
exports.addListCall = function addList(disModel, title, callback){
  //find file
  disModel.findOne({name:{'$regex':'^'+title+'$','$options':'i'}}, function (err, res){
    if (!res){
      newModel = new disModel({name:title});
      newModel.save();callback(true);
    } else callback(false);
  });
};
//Remove documents
exports.delList = function (disModel, title, callback){
  //find file
      disModel.deleteMany({name:{'$regex':'^'+title+'$','$options':'i'}},function (err){

        console.log('Deleted successfully!');
        callback();
      });
};
//add activity logs
exports.actlogsCreate = function (User, Deyt, Action, Doc, Serial){
  //Create records
  var newDoc = new activitylogsModel({
    user: User,
    deyt: Deyt,
    action: Action,
    doc: Doc,
    serial: Serial,
  });
  newDoc.save(function(err){
    console.log('Logs Added successfully!')
  });
};
//find monitoring by title
exports.actlogFindAction = function (action, callback){
  //find file
  activitylogsModel.find({action:{'$regex':'^'+action+'$','$options':'i'}}, function (err, res){
    //console.log(res);
    callback(res);
  });
};
//find monitoring by title
exports.actlogFindSerial = function (serial, callback){
  //find file
  activitylogsModel.find({serial:{'$regex':'^'+serial+'$','$options':'i'}}, function (err, res){
    //console.log(res);
    callback(res);
  });
};
//edit activity logs
exports.actlogSignEdit = function (Doc, newDoc){
  //Create records
  var disDoc = {
    doc: newDoc,
  };
  activitylogsModel.updateOne({doc:{'$regex':'^'+Doc+'$','$options':'i'}},[{$set:disDoc}], function(err){
    console.log('Doc Sign Log Updated');
  });
};
//find monitoring by branch
exports.actlogFilterOne = function actlogFilterOne(Doc, callback){
  //find file
  activitylogsModel.find({doc:{'$regex':'^'+Doc+'$','$options':'i'}}, function (err, res){
    let newItem = [];
    res.forEach((item)=>{newItem.push(item);});
    while (newItem.length > 1) {
      let disItem = newItem.shift();
      activitylogsModel.deleteMany({serial:{'$regex':'^'+disItem.serial+'$','$options':'i'}},function (err){
        if (newItem.length = 1) callback();
      });
    }
  });
};
//find monitoring by title
exports.genMonitor = function genMonitor(callback){
  //find file
  monitorModel.find(function (err, res){

    //console.log(res);
    callback(res);
  });
};

//find monitoring by title
exports.monitorFindTitle = function monitorFindTitle(title, callback){
  //find file
  monitorModel.findOne({title:{'$regex':'^'+title+'$','$options':'i'}}, function (err, res){

    //console.log(res);
    callback(res);
  });
};
//find monitoring by filename
exports.monitorFindFile = function monitorFindFile(title, callback){
  //find file
  monitorModel.findOne({filename:{'$regex':'^'+title+'$','$options':'i'}}, function (err, res){

    //console.log(res);
    callback(res);
  });
};
//find monitoring by branch
exports.monitorFindBranch = function monitorFindBranch(title, callback){
  //find file
  monitorModel.find({branch:{'$regex':'^'+title+'$','$options':'i'}}, function (err, res){
    //console.log(res);
    callback(res);
  });
};
//Remove documents in monitoring
exports.monitorDel = function monitorDel(filename, callback){
  //find file
  monitorModel.deleteMany({filename:{'$regex':'^'+filename+'$','$options':'i'}},function (err){

    console.log('Deleted successfully!');
    callback();
  });
};
//add documents to monitoring
exports.monitorCreate = function monitorCreate(Title, Filename, Deyt, Branch, Filepath){
  //Create records
  var newDoc = new monitorModel({
    title: Title,
    filename: Filename,
    filepath: Filepath,
    route:[{
          deyt: Deyt,
          branch: Branch,
        }],
  });
  newDoc.save(function(err){
    console.log('Added successfully!')
  });
};
//add documents to monitoring
exports.monitorCopy = function (Title, Filename, Filepath, Route){
  //Create records
  var newDoc = new monitorModel({
    title: Title,
    filename: Filename,
    filepath: Filepath,
    route:Route,
  });
  newDoc.save(function(err){
    console.log('Added successfully!')
  });
};
//add documents to monitoring
exports.monitorEdit = function monitorEdit(Title, Filename, Deyt, Branch, Filepath){
  //Create records
  var disDoc = {
    filename: Title,
    filepath: Filepath,
    route:[{
          deyt: Deyt,
          branch: Branch,
        }],
  };
  monitorModel.updateOne({filename:{'$regex':'^'+Filename+'$','$options':'i'}},[{$set:disDoc}], function(err){
    console.log('Updated successfully!');
  });
};
//add documents to monitoring
exports.monitorUpdateTitle = function (Title, Filename){
  //Create records
  var disDoc = {
    title: Title,
  };
  monitorModel.updateOne({filename:{'$regex':'^'+Filename+'$','$options':'i'}},[{$set:disDoc}], function(err){

    console.log('Updated successfully!');
  });
};
//add documents to monitoring
exports.monitorUpdateFilename = function (Filename, newFile){
  //Create records
  var disDoc = {
    filename: newFile,
  };
  monitorModel.updateOne({filename:{'$regex':'^'+Filename+'$','$options':'i'}},[{$set:disDoc}], function(err){

    console.log('Updated successfully!');
  });
};
//add documents to monitoring
exports.monitorUpdateFile = function (oldFile, newFile, Route, Filepath, callback){
  //Create records
  var disDoc = {
    filename: newFile,
    filepath: Filepath,
    route: Route,
  };
  monitorModel.updateOne({filename:{'$regex':'^'+oldFile+'$','$options':'i'}},[{$set:disDoc}], function(err){

    console.log('Updated successfully!');
    callback();
  });
};
//add documents to monitoring
exports.monitorAddRoute = function monitorAddRoute(Title, Filename, Route, Filepath){
  //Create records
  var disDoc = {
    filename:Title,
    filepath: Filepath,
    route: Route,
  };
  monitorModel.updateOne({filename:{'$regex':'^'+Filename+'$','$options':'i'}},[{$set:disDoc}], function(err){

    console.log('Updated successfully!');
  });
};
//find monitoring by filename
exports.tempmonitorFindFile = function (title, callback){
  //find file
  tempmonitorModel.findOne({filename:{'$regex':'^'+title+'$','$options':'i'}}, function (err, res){

    //console.log(res);
    callback(res);
  });
};
//Remove documents in monitoring
exports.tempmonitorDel = function (filename, callback){
  //find file
  tempmonitorModel.deleteMany({filename:{'$regex':'^'+filename+'$','$options':'i'}},function (err){

    console.log('Deleted successfully!');
    callback();
  });
};
//add documents to monitoring
exports.tempmonitorCreate = function (Title, Filename, Route, Filepath){
  //Create records
  var newDoc = new tempmonitorModel({
    title: Title,
    filename: Filename,
    filepath: Filepath,
    route:Route,
  });
  newDoc.save(function(err){

    console.log('Added successfully!')
  });
};


//find document
exports.docFind = function docFind(filename, callback){
  docModel.findOne({filename:{'$regex':'^'+filename+'$','$options':'i'}}, function (err, res){
    if (!err) callback(res);
  });
};
//find document by id
exports.docFindbyId = function (Id, callback){
  docModel.findOne({id:Id}, function (err, res){
    callback(res);
  });
};
//get all files in a Directory
exports.getFilesbyDir = function (folder, callback){
  docModel.find({filename:{'$regex':'.*^'+folder+'.*$','$options':'i'}}, function (err, res){
    if (!err) {
      let newRes = [];
      res.forEach((item)=>{
        let tmpFile = item.filename.toUpperCase().replace(folder.toUpperCase(),'');
        //console.log(tmpFile);
        if (!tmpFile.includes('/')) newRes.push(item);
      });
      callback(newRes);
    }
  });
};
//create Documents
exports.docCreate = function docCreate(Id, Title, Filename, Category, Author, Projects, Deyt, Size, Content, Rout, Ref, Encl, Comment){
  //Create records
  var newDoc = new docModel({
    id:Id,
    title:Title,
    filename:Filename,
    category:Category,
    author:Author,
    projects:Projects,
    deyt:Deyt,
    size:Size,
    content:Content,
    routeslip: Rout,
    reference: Ref,
    enclosure: Encl,
    comment: Comment
  });
  newDoc.save(function(err){

    console.log('Added successfully!')
  });
};
//Update Document except reference and enclosure
exports.docUpdateId = function (Id, Filename){
  //Create records
  var disDoc = {
    id:Id
  };
  docModel.updateOne({filename:{'$regex':'^'+Filename+'$','$options':'i'}},[{$set:disDoc}], function(err){
    console.log('Updated Id successfully!');
  });
};
//Update Document except reference and enclosure
exports.docUpdateNoRefEnc = function docUpdateNoRefEnc(Id, Filename, Rout, Comment){
  //Create records
  var disDoc = {
    filename:Filename,
    routeslip: Rout,
    comment:Comment
  };
  docModel.updateOne({id:Id},[{$set:disDoc}], function(err){
    console.log('Updated Comment successfully!');
  });
};
//Update Document except reference and enclosure
exports.docUpdateNoRefEncIncoming = function docUpdateNoRefEnc(Filename, Rout, Comment){
  //Create records
  var disDoc = {
    routeslip: Rout,
    comment:Comment
  };
  docModel.updateOne({filename:{'$regex':'^'+Filename+'$','$options':'i'}},[{$set:disDoc}], function(err){
    console.log('Updated Comment successfully!');
  });
};
//Update Document except reference and enclosure
exports.docUpdateEncOnly = function (Filename, Encl){
  //Create records
  var disDoc = {
    enclosure: Encl
  };
  docModel.updateOne({filename:{'$regex':'^'+Filename+'$','$options':'i'}},[{$set:disDoc}], function(err){
    console.log('Updated successfully!');
  });
};
//edit Documents date, size, title, filename, and content only
exports.docEditWatch = function(Id, Title, Filename, Deyt, Size, Content){
  //Create records
  var disDoc = {
    title:Title,
    filename:Filename,
    deyt:Deyt,
    size:Size,
    content:Content
  };
  docModel.updateOne({id:Id},[{$set:disDoc}], function(err){

    console.log('Updated successfully!');
  });
};
//edit Documents
exports.docEdit = function docEdit(Id, Title, Filename, Category, Author, Projects, Deyt, Size, Content, Rout, Ref, Encl, Comment){
  //Create records
  var disDoc = {
    title:Title,
    filename:Filename,
    category:Category,
    author:Author,
    projects:Projects,
    deyt:Deyt,
    size:Size,
    content:Content,
    routeslip: Rout,
    reference: Ref,
    enclosure: Encl,
    comment:Comment
  };
  docModel.updateOne({id:Id},[{$set:disDoc}], function(err){

    console.log('Updated successfully!');
  });
};

//Remove documents
exports.docDel = function docDel(filename, callback){
  //find file
  docModel.deleteMany({filename:{'$regex':'^'+filename+'$','$options':'i'}},function (err){
    if (!err) {
      console.log('Deleted successfully!');
      callback();
    }
  });
};

//Find User
exports.userFind = function userFind(name, callback){
  //find file
  var ret = {};
  userModel.findOne({ userN:{'$regex':'^'+name+'$','$options':'i'} }, function(err, user){
    if (!err) {
      callback(user);
    }
  });
};
//Remove user account
exports.userDel = function (name, callback){
  //find file
  userModel.deleteMany({userN:{'$regex':'^'+name+'$','$options':'i'}},function (err){
    if (!err) {
      console.log('Deleted successfully!');
      callback();
    }
  });
};
//Find Users in group
exports.groupFind = function (name, callback){
  //find file
  userModel.find({ group:{'$regex':'^'+name+'$','$options':'i'} }, function(err, userB){

    branch = [];
    userB.forEach(function (disUser){
      branch.push(disUser.userN);
    });
    userModel.find(function(err, userO){
      others = [];
      userO.forEach(function (disOth){
        if (disOth.group.toUpperCase()!=name.toUpperCase()) others.push(disOth.userN);
      });
      var allUsers = [{branch:branch, others:others}]
      callback(allUsers);
    })
  });
};
//Create User AccountsS
exports.userCreate = function (UserN, PassW, Email, Group, Level, Path, Files) {
    //Create records
  //var hashVal = new hash.SHA512().b64(PassW);
  var hashVal = PassW;
  var salt = crypto.randomBytes(16).toString('hex');
  var passCrypt = crypto.pbkdf2Sync(hashVal, salt, 10000, 512, 'sha512').toString('hex');
  //var dislevel=dutyAdmin, sysAdmin, dutyBranch, oicBranch, exo, dep, co
  //var dislevel=SECRETARY, sysAdmin, STAFF, MANAGER, EAGM, GM
  var newUser = new userModel({userN:UserN, hashP:passCrypt, email:Email, salt:salt, group:Group, level:Level, path:Path, mailfiles:Files});
  newUser.save(function(err){

    console.log('saved successfully!')
  });
};
//Generate All Users
exports.genUsers = function (callback){
  userModel.find(function (err, res){
    callback(res);
  });
};
//toggle level
exports.updateLevel = function (UserN, Level, callback){
  //Update records
  var disUser = {level:Level}
  userModel.updateOne({userN:{'$regex':'^'+UserN+'$','$options':'i'}},[{$set:disUser}], function(err){
    console.log('Updated successfully!');
    callback();
  });
};
//Update mail files
exports.userUpdMail = function (UserN, Files, callback){
  //Create records
  var disUser = {mailfiles:Files};
  userModel.updateOne({userN:{'$regex':'^'+UserN+'$','$options':'i'}},[{$set:disUser}], function(err){
    console.log('Updated successfully!');
    callback();
  });
};
//Update Users
exports.userUpdate = function (UserN, PassW, Email, Salt, Group, Level, Path, Files, callback){
  //Create records
  var disUser = {hashP:PassW, email:Email, salt:Salt, group:Group, level:Level, path:Path, mailfiles:Files}
  userModel.updateOne({userN:{'$regex':'^'+UserN+'$','$options':'i'}},[{$set:disUser}], function(err){
    console.log('Updated successfully!');
    callback();
  });
};
//Update Profile Fullname
exports.userQRUpdate = function (UserN, fullname, callback) {
  //Create records
  var disUser = {email:fullname}
  userModel.updateOne({userN:{'$regex':'^'+UserN+'$','$options':'i'}},[{$set:disUser}], function(err){
    console.log('Updated successfully!');
    callback();
  });
};
//Update Profile Password
exports.userPassUpdate = function (UserN, PassW, callback) {
  var hashVal = PassW;
  var salt = crypto.randomBytes(16).toString('hex');
  var passCrypt = crypto.pbkdf2Sync(hashVal, salt, 10000, 512, 'sha512').toString('hex');
  var disUser = {hashP:passCrypt, salt:salt}
   userModel.updateOne({userN:{'$regex':'^'+UserN+'$','$options':'i'}},[{$set:disUser}], function(err){
    console.log('Updated successfully!');
    callback();
  });
};
//Update Users
exports.userUpdPass = function (UserN, PassW, Email, Group, Level, Path, Files){
  //Create records
  //var hashVal = new hash.SHA512().b64(PassW);
  var hashVal = PassW;
  var salt = crypto.randomBytes(16).toString('hex');
  var passCrypt = crypto.pbkdf2Sync(hashVal, salt, 10000, 512, 'sha512').toString('hex');
  var disUser = {hashP:passCrypt, email:Email, salt:salt, group:Group, level:Level, path:Path, mailfiles:Files}
  if (PassW=='') disUser = {email:Email, group:Group, level:Level, path:Path, mailfiles:Files}
  userModel.updateOne({userN:{'$regex':'^'+UserN+'$','$options':'i'}},[{$set:disUser}], function(err){

    console.log('Updated successfully!');
  });
};
exports.validatePassword = function (name, hashVal, callback){
  //var hashVal = new hash.SHA512().b64(password);
  userModel.findOne({ userN:{'$regex':'^'+name+'$','$options':'i'} }, function(err, user){

    var passCrypt = crypto.pbkdf2Sync(hashVal, user.salt, 10000, 512, 'sha512').toString('hex');
    callback(user.hashP === passCrypt);
  });
};
exports.validateFullname = function (name, pass, callback){
  //var hashVal = new hash.SHA512().b64(password);
  userModel.findOne({ userN:{'$regex':'^'+name+'$','$options':'i'} }, function(err, user){
    var hashemail = new hash.SHA512().b64(user.email);
    callback(hashemail === pass);
  });
};
  //create setting
  exports.settingCreate = function (Maindrive, Publicdrive, Publicstr, AI) {
    var newSetting = new settingModel({server:'localhost', maindrive:Maindrive, publicdrive:Publicdrive, publicstr:Publicstr, ai:AI});
     newSetting.save(function(err){
      console.log('setting saved successfully!')
    });
  };
  //Update setting
  exports.settingUpdate = function (Maindrive, Publicdrive, Publicstr, callback) {
    var disSetting = {maindrive:Maindrive, publicdrive:Publicdrive, publicstr:Publicstr};
    settingModel.updateOne({server:'localhost'},[{$set:disSetting}], function(err){
      console.log('setting updated successfully!')
      callback();
    });
  };
  //Update setting AI
  exports.settingAIUpdate = function (AI, callback) {
    var disSetting = {ai:AI};
    settingModel.updateOne({server:'localhost'},[{$set:disSetting}], function(err){
      console.log('setting updated successfully!')
      callback();
    });
  };
  //Update setting AI
  exports.settingmgmtUpdate = function (mgmt, callback) {
    var disSetting = {topmgmt:mgmt};
    settingModel.updateOne({server:'localhost'},[{$set:disSetting}], function(err){
      console.log('setting updated successfully!')
      callback();
    });
  };
  //create show settings
  exports.settingDis = function (callback) {
    settingModel.findOne({ server:'localhost' }, function(err, setting){
      callback(setting);
    });
  };
  //update commo logs
  exports.commologsUpdate = function (Year, Month, Branch, callback) {
    commologsModel.findOne({year:Year, month:Month, branch:Branch}, function (err, disLog){
      if (!disLog) {
        let newCommologs = new commologsModel({year:Year, month:Month, branch:Branch, count:1});
        newCommologs.save(function(err){

         console.log('Commo logs saved successfully!')
         return callback();
        });
      } else {
        let count = disLog.count; ++count;
        let commologs = {count:count}
        commologsModel.updateOne({year:Year, month:Month, branch:Branch},[{$set:commologs}], function(err){

          console.log('Commo logs updated successfully!')
          return callback();
        });
      }
    });
  };
  //Generate commo logs for the year
  exports.commologsGen = function (Year, allBranch, callback) {
    let allMonth = ['Jan', 'Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let outData = [];
    commologsModel.findOne({year:Year}, function (err, disYear){
      if (!disYear) {
        callback(null);
      } else {
        allMonth.forEach((resMonth, monthIdx)=>{
          allBranch.forEach((resBranch, branchIdx)=>{
            commologsModel.findOne({year:Year, month:resMonth.toUpperCase(), branch:resBranch}, (err,disLog)=>{
              if (!disLog) outData.push({month:resMonth,branch:resBranch,count:0});
              else outData.push({month:resMonth,branch:resBranch,count:disLog.count});
              if ((branchIdx==allBranch.length-1) && (monthIdx==allMonth.length-1)) callback(outData);
            });
          });
        })
      }
    });
  };
