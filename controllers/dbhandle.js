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
});
//User Accounts DB
const userSchema = new Schema({
  userN: String,
  hashP: String,
  email: String,
  salt: String,
  level: String,
});
//compile model from schema
var docModel = new mongoose.model('pnDocs',docSchema);
//create Documents
exports.docCreate = function docCreate(Id, Title, Filename, Category, Author, Projects, Deyt, Size, Content){
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
    content:Content
  });
  newDoc.save(function(err){
    if (err) throw err;
    console.log('Added successfully!')
  });
};
//edit Documents
exports.docEdit = function docEdit(Id, Title, Filename, Category, Author, Projects, Deyt, Size, Content){
  //Create records
  var disDoc = {
    title:Title,
    filename:Filename,
    category:Category,
    author:Author,
    projects:Projects,
    deyt:Deyt,
    size:Size,
    content:Content
  };
  docModel.updateOne({id:Id},[{$set:disDoc}], function(err){
    if (err) throw err;
    console.log('Updated successfully!')
  });
};
//Remove documents
exports.docDel = function docDel(Title){
  //find file
  docModel.deleteMany({title:Title},function (err){
    if (err) throw err;
    console.log('Deleted successfully!')
  });
};
//Create User Accounts
exports.userCreate = function (UserN, PassW, Email, Level) {
  //compile model from schema
  var userModel = new mongoose.model('userAcc',userSchema);

  //Create records
  var hashVal = new hash.SHA512().b64(PassW);
  var salt = crypto.randomBytes(16).toString('hex');
  var passCrypt = crypto.pbkdf2Sync(hashVal, salt, 10000, 512, 'sha512').toString('hex');
  //var dislevel=dutyAdmin, sysAdmin, dutyBranch, oicBranch, exo, dep, co
  var newUser = new userModel({userN:UserN, hashP:passCrypt, email:Email, salt:salt, level:Level});
  newUser.save(function(err){
    if (err) throw err;
    console.log('saved successfully!')
  });
};
