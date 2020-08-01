const mongoose = require('mongoose');
const hash = require('jshashes');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Schema = mongoose.Schema;
//const {Schema} = mongoose;
mongoose.connect('mongodb://127.0.0.1/docMS', { useNewUrlParser: true, useUnifiedTopology: true });

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const userSchema = new Schema({
  userN: String,
  hashP: String,
  email: String,
  salt: String,
  group: String,
  level: String,
  path: String,
});

userSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  var hashVal = new hash.SHA512().b64(password);
  this.passCrypt = crypto.pbkdf2Sync(hashVal, this.salt, 10000, 512, 'sha512').toString('hex');
};

userSchema.methods.validatePassword = function(hashVal){
  //var hashVal = new hash.SHA512().b64(password);
  var passCrypt = crypto.pbkdf2Sync(hashVal, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hashP === passCrypt;
};

userSchema.methods.generateJWT = function() {
  const today = new Date();
  const expirationDate = new Date(today);
  expirationDate.setDate(today.getDate() + 60);

  return jwt.sign({
    userN: this.userN,
    id: this._id,
    exp: parseInt(expirationDate.getTime() / 1000, 10),
  }, 'secret');
}

userSchema.methods.toAuthJSON = function() {
  return {
    _id: this._id,
    userN: this.userN,
    token: this.generateJWT(),
  };
};

var userModel = mongoose.model('userAcc', userSchema);
module.exports = userModel;
