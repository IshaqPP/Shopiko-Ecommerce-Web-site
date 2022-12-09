var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs=require('express-handlebars');
var fileUpload=require('express-fileupload');
const Handlebars=require('handlebars')
var session = require('express-session')
require('dotenv').config()

const bodyParser = require('body-parser');
var productHelpers = require('./helpers/product-helpers');

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var db=require('./config/connection')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials'
}))

Handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

Handlebars.registerHelper('ifCheck', function (arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
})

Handlebars.registerHelper ('multiply', function(a, b) {
  return Number(a) * Number(b);
});

Handlebars.registerHelper ('Add', function(a, b,c,d) {
  
  return Number(a) + Number(b) + Number(c) + Number(d);
});


app.use(logger('dev'));
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:'Key',cookie:{maxAge:6000000}}))

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, private,no-store,must-revalidate,max-stale=0,pre-check=0')
  next()
})

db.connect((err)=>{
  if(err)
    console.log("Connection failed"+ err);
  else
  console.log("Connection success");
});


app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
