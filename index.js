/*
Main app

@author Nelson Maligro
@copyright 2020
@license GPL
*/
const express = require('express');
const layouts = require('express-ejs-layouts');
const dasincoming = require('./controllers/dasincoming');
const dastransact = require('./controllers/dastransact');
const dasmonitor = require('./controllers/dasmonitor');
const dasroyalty = require('./controllers/dasroyalty');
const dasfileoperation = require('./controllers/dasfileoperation');
const dassysadmin = require('./controllers/dassysadmin');
const dassearch = require('./controllers/dassearch');
const login = require('./controllers/login')
const dbhandle = require('./controllers/dbhandle');
var http = require('http');
var https = require('https');
const fs = require('fs');
var domain = require('domain');

var morgan = require('morgan')
// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream('access-'+Date.now()+'.log',{flags: 'a'});




var d = domain.create();
setTimeout (()=>{

  d.on('error', function(err) {
    fs.appendFileSync('err.log',err.message + '\n' + err.stack + '\n');
    throw err;
  });

  d.run(function() {

    dbhandle.settingDis((setting)=>{
      drive = setting.maindrive;
      var app = express();
      const httpApp = express();
      // setup the logger
      app.use(morgan('combined', {stream: accessLogStream}))
      //View Engine
      app.set('view engine','ejs');

      app.use(layouts);

      //export db collections
      var classModel = dbhandle.disModel('class');
      var tagModel = dbhandle.disModel('tag');
      var brModel = dbhandle.disModel('branch')
      var arrDB = {class:classModel,tag:tagModel,branch:brModel};

      //run controllers
      dasmonitor(app, arrDB);
      dasroyalty(app,arrDB);
      dasincoming(app, arrDB);
      dastransact(app,arrDB);
      dasfileoperation(app,arrDB);
      dassysadmin(app,arrDB);
      dassearch(app,arrDB);
      login(app);
      let keyLoc = 'models/127.0.0.1.key'; let certLoc = 'models/127.0.0.1.cert';
      if ((fs.existsSync(drive + '127.0.0.1.key')) && (fs.existsSync(drive + '127.0.0.1.cert'))) {
        keyLoc = drive + '127.0.0.1.key'; certLoc = drive + '127.0.0.1.cert';
      }
      https.createServer({
        key: fs.readFileSync(keyLoc),
        cert: fs.readFileSync(certLoc)
      }, app)
      .listen(443, function () {
        console.log('DocMS running at https');
      });

      //For redirect
      httpApp.get('*', function(req, res) {
        res.redirect('https://' + req.headers.host + req.url);
      });
      httpApp.use(function(request, response){
        if(!request.secure){
          response.redirect("https://" + request.headers.host + request.url);
        }
      });
      http.createServer(httpApp)
      .listen(80, function () {
        console.log('DocMS running at http for redirect');
      });
    });
  });
},1000);
