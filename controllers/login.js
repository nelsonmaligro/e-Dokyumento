//forward to main app (index.js)

module.exports = function(app){

  const mongoose = require('mongoose');
  const passport = require('passport');
  var localStrategy = require('passport-local').Strategy;
  var path = require('path');
  var bodyParser = require('body-parser');

  const userModel = require('../models/accounts');

  //var urlencodedParser = bodyParser.urlencoded({extended:true});
  app.use(bodyParser.urlencoded({extended:true})) // parse application/x-www-form-urlencoded
  app.use(bodyParser.json()) // parse application/json

  app.use(passport.initialize());
  app.use(passport.session());

   //post incoming with params
  app.post('/', function(req,res, next) {
    passport.authenticate('login', {session:false}, function (err,passportuser,info){
      if (err) { console.log(err);return next(err); }
      if (!passportuser) { console.log('Login Failed'); return res.render('login', {layout:'empty', error:info}); }
      if (passportuser) {
        const user = passportuser;
        user.token = passportuser.generateJWT();
        res.cookie('token', user.toAuthJSON());
        res.cookie('me',user.userN);
        res.redirect('/incoming');
      }
    })(req, res, next);
  });

//validate password through passport login
  passport.use('login', new localStrategy({
    username: 'username',
    password: 'password'
  }, function (username, password, done){
    try {
      //Find the user associated with the email provided by the user
      userModel.findOne({ userN:username }, function(err, user){
          if (err) { console.log(err); return done(err); }
          if (!user) {console.log('User not found'); return done(null, false, "wrongUser"); }
          //Validate password and make sure it matches with the corresponding hash stored in the database
          if(!user || !user.validatePassword(password)) {
            console.log('invalid password')
            return done(null, false, "wrongPass");
          }
          console.log('Valid User')
          return done(null, user, "Valid");
        });
    } catch (error) {
      return done(error);
    }
  }));




};
