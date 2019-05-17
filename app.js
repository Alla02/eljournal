var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var importSchedule = require('./routes/importSchedule');

var app = express();

var config = require('./config');
var mysql = require('mysql');
var pool = mysql.createPool(config.dbconnection);
var session = require('express-session');
var flash= require('connect-flash');
var bodyParser = require('body-parser');
var passport = require('passport');
var pp = require('./passport');
//all the good passport stuff are stored here (in pp.js)
pp.init(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

//For BodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// For Passport
app.use(session({secret: config.sessionSecret, saveUninitialized: true, resave: true})); 
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/', importSchedule);


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


var currentWeek,selectedWeek;
global.updateWeek = function() {
  pool.getConnection(function (err, db) {
    var result = [];
    if (err) {
      console.log(err);
    } // not connected!
    else {
      db.query(`SELECT * FROM semester ORDER BY id DESC LIMIT 1;`, (err, rows) => {
        if (err) {
          console.log(err);
        }
        else {
          rows.forEach(row => {
            result.push({
              begin_date: row.start,
              end_date: row.end,
              week: row.week
            });
          });

          app.locals.dateMob = getDate(result[0].begin_date, result[0].week,)[0];
          app.locals.date = getDate(result[0].begin_date, result[0].week,)[0];
          app.locals.curweek = getDate(result[0].begin_date, result[0].week,)[1];
          //app.locals.dateBeginSemester = result[0].begin_date;
          //app.locals.dateEndSemester = result[0].end_date;
          currentWeek = app.locals.curweek;
          //dateBeginSemester = app.locals.dateBeginSemester;
          //dateEndSemester = app.locals.dateEndSemester;
        }
      });
    }

  });
};

updateWeek();
function getDate(begin_date,week) {
  var day = ("Воскресенье", "Понедельник", "Вторник",
      "Среда", "Четверг", "Пятница", "Суббота");
  var d = new Date();
  var month = ["января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"];

  var TODAY = day[d.getDay()] + " " + d.getDate() + " " + month[d.getMonth()]
      + " " + d.getFullYear() + " г.";

  var info,curweek;

  var startWeek = week;

  var dateCurrent = new Date();

  var dateBegin  = new Date(begin_date);
  var timeBegin = dateBegin.getTime();
  var dayBegin = dateBegin.getDay();
  var differenceDay = Math.floor ((dateCurrent - timeBegin) / 8.64e7) + (dayBegin ? dayBegin - 1 : 6);

  var currentOfWeek =  (Math.floor(differenceDay / 7) % 2);
  //console.log("current "+currentOfWeek);
  //console.log("week "+startWeek);
  if (currentOfWeek ===0){
    if(startWeek ==="Верхняя"){
      info = "Верхняя неделя";
      curweek = "Верхняя"
    }
    else{
      info = "Нижняя неделя";
      curweek = "Нижняя"
    }
  }
  else {
    if(startWeek ==="Верхняя"){
      info = "Нижняя неделя";
      curweek = "Нижняя"
    }
    else{
      info = "Верхняя неделя";
      curweek = "Верхняя"
    }
  }

  return [TODAY+' '+'('+info+')',curweek];
}

global.getCurrentWeek = function() {
  if(currentWeek===undefined){
    updateWeek();
    currentWeek = app.locals.week;
  }

  return currentWeek;
};

module.exports = {
  getCurrentWeek: getCurrentWeek
};

module.exports = app;
