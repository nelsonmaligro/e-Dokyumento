const express = require('express');
const layouts = require('express-ejs-layouts');
const dasbord = require('./controllers/dasbord');

const login = require('./controllers/login')

var app = express();
//View Engine
app.set('view engine','ejs');

//bootstap static folder
app.use(express.static('./public'));
app.use(layouts);

//run controllers
dasbord(app);
login(app);

app.listen(80);
console.log('DocMS running');


//data.text_pages.forEach(function(text){
//  console.log(text);
//});
