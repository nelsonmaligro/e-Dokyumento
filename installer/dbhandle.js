const mongoose = require('mongoose');
const {Schema} = mongoose;
const hash = require('jshashes');
const crypto = require('crypto');

mongoose.connect('mongodb://127.0.0.1/docMS', { useNewUrlParser: true, useUnifiedTopology: true });

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//Dcoument DB
const docSchema = new Schema({
  title: String,
  filename: String,
  category: String,
  projects: [],
  author: String,
  deyt: Date,
  content: String,
});

//compile model from schema
var docModel = new mongoose.model('pnDocs',docSchema);
//Create records
var newDoc = new docModel({
  title:'Sample Doc',
  filename:'sample.doc',
  category:'DF',
  author:'Nelson Maligro',
  projects:['cyber','command and control','communications'],
  deyt:Date(),
  content:'The quick brown fox jumps over the lazy dog on every corner of the house'
});
//newDoc.save(function(err){
//  if (err) throw err;
//  console.log('saved successfully!')
//});
docModel.findOne({title:'Sample Doc'}, function (err, docs){
  console.log(docs._id);

});



//User Accounts DB
/*
const userSchema = new Schema({
  userN: String,
  hashP: String,
  email: String,
  salt: String,
  level: String,
});

//compile model from schema
var userModel = new mongoose.model('userAcc',userSchema);
userModel.findOne({userN:"nelson"},function(err,docs){
  console.log(docs);
});
//Create records

var hashVal = new hash.SHA512().b64('maligro');
var salt = crypto.randomBytes(16).toString('hex');
var passCrypt = crypto.pbkdf2Sync(hashVal, salt, 10000, 512, 'sha512').toString('hex');
//var dislevel=dutyAdmin, sysAdmin, dutyBranch, oicBranch, exo, dep, co
var newUser = new userModel({userN:'mario', hashP:passCrypt, email:'nelsonmaligro@gmail.com', salt:salt, level:'oicBranch'});
newUser.save(function(err){
  if (err) throw err;
  console.log('saved successfully!')
});
*/
