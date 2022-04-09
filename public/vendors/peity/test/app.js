var express = require('express')
  , Chart = require('./chart')

var sendfile = function(filename, root) {
  return function(_, res) {
    res.sendFile(filename, { root: root })
  }
}

var jquery = sendfile('/jquery-1.6.2.min.js', __dirname)
  , peity = sendfile('/jquery.peity.js', __dirname + '/..')
  , style = sendfile('/style.css', __dirname)

var index = function(_, res) {
  res.render('index', {
    charts: Chart.all()
  })
}

var show = function(req, res) {
  var id = req.params.id
    , chart = Chart.find(id)

  if (chart) {
    res.render('show', {
      chart: chart
    })
  } else {
    res
      .status(404)
      .end()
  }
}

var app = express();
// set up rate limiter: maximum of five requests per minute
var rateLimit = require('express-rate-limit');
var limiter = rateLimit({
windowMs: 1*60*1000, // 1 minute
max: 5
});

// apply rate limiter to all requests
app.use(limiter);
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
  app.get('/jquery.min.js', jquery);
  app.get('/jquery.peity.js', peity);
  app.get('/style.css', style);
  app.get('/', index);
  app.get('/:id', show);



module.exports = app
