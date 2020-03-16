//forward to main app (index.js)

module.exports = function(app){
  var scanocr = require('./scanocr');
  var routeduty = require('./routeduty');
  var fs = require('fs');
  var path = require('path');
  var bodyParser = require('body-parser');
  const { spawn } = require('child_process');
  const cookieParser = require('cookie-parser');
  //const auth = require('../controllers/auth');
  //const userModel = require('../models/accounts');
  const jwt = require('jsonwebtoken');
  app.use(cookieParser());

  var urlencodedParser = bodyParser.urlencoded({extended:true});
  var drivetmp = "public/drive/incoming-temp";
  var drive = "D:/drive/";

  //run ML from python
  function runPy(pathtxt){
      return new Promise(function(success, nosuccess) {
      const pyprog = spawn('python',['docPred.py',pathtxt]);
      pyprog.stdout.on('data', function(data) {
          success(data);
      });
      pyprog.stderr.on('data', (data) => {
          nosuccess(data);
      });
    });
  };
  //validate token
  function validToken(req, res, callback){
    var token = req.cookies['token'];
    if (!token) { return res.render('login', {layout:'empty', error:'Valid'});}
    jwt.verify(token.token, 'secret', function (err, decoded){
      if (err) { return res.render('login', {layout:'empty', error:'Valid'});}
      callback(decoded);
    });
  };
  //Logout
  app.get('/logout', function(req, res){
    res.clearCookie("token");
    req.logout();
    return res.render('login', {layout:'empty', error:'Valid'});
  });
  //get incoming no params
  app.get('/incoming', function(req,res){
    validToken(req, res, function (decoded){
      fs.readdir(drivetmp, function(err,items){
          if (err) throw err;var def="empty";
          if (items.length > 0) {def=items[0];}
          return res.render('incoming', {layout:'layout-user', files:items, disp:def});
        });
    });
  });
  //get incoming with params
  app.get('/incoming/:file',function(req,res){
    validToken(req, res, function(decoded){
      fs.readdir(drivetmp, function(err,items){
        if (err) throw err;
        res.render('incoming', { layout:'layout-user', files:items, disp:req.params.file});
      });
    });
  });
  //post to OCR scan Document
  app.post('/incoming/scandoc', urlencodedParser, function(req,res){
    scanocr.outtext(drivetmp +'/'+ req.body.fileroute, function(data){
      fs.writeFile(drive + 'textML/tmp.txt', data, function (err){
        res.json(data);
      });
    });
  });

  //post to AI analyze Document
  app.post('/incoming/analyzedoc', urlencodedParser, function(req,res){
    runPy(drive + 'textML/tmp.txt').then(function(data){
      console.log(data.toString());
      res.json(data.toString());
    });
  });

  //post incoming with params
  app.post('/incoming', urlencodedParser, function(req,res){
    validToken(req, res, function(decoded){
      if (fs.existsSync(path.resolve(drivetmp+"/" + req.body.fileroute))){
        routeduty.routeThis(req,res,drivetmp,drive);
      }else{
        res.json({layout:'layout-user', files:"empty", disp:"empty"});
      }
    });
  });
  //html get login
  app.get('/', function(req, res){
    validToken(req, res, function (decoded){
      fs.readdir(drivetmp, function(err,items){
          if (err) throw err;var def="empty";
          if (items.length > 0) {def=items[0];}
          return res.redirect('/incoming');
        });
    });
    //return res.redirect('/incoming', { user: user.toAuthJSON(), layout:'layout-user', files:items, disp:def});
  });
  //html get Register
  /*
  app.get('/register',function(req, res){
    res.render('register', {layout:'empty'});
  });
  */
  //html get comment and annotate
  app.get('/edit',function(req,res){
    validToken(req, res, function(decoded){
      res.render('editmce');
    });
  });

};
