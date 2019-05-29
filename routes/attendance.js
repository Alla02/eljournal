var express = require('express');
var router = express.Router();
var config = require("../config");
var mysql = require("mysql");
var pool = mysql.createPool(config.dbconnection);

var passport = require("passport");
var bcrypt = require("bcryptjs");
var fs = require('fs');
var http = require('http');

/*auth part*/
isLoggedIn = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/register");
  }
};

router.get('/attendance/:id',isLoggedIn, function(req, res, next) {
  var listStudents = [];
  pool.getConnection(function(err, db) {
    if (err) return next(err);
    var login,lastname,secondname,firstname,type_user,email = "";
    if (req.user){
      login = req.user.login;
      lastname = req.user.last_name;
      firstname = req.user.first_name;
      type_user = req.user.user_type;
      email = req.user.email;
      secondname = req.user.second_name;
    }
    db.query("SELECT canView, id_group FROM students WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?));",login, (err, rows) => {
      if (err) return next(err);
      if (rows.length != 0) {
        if (rows[0].canView ===1 && rows[0].id_group === Number(req.params.id)) {//проверка является ли пользователь старостой и принадлежит ли группе
          db.query("SELECT name FROM studyGroups WHERE id=?;", req.params.id, (err, rows) => {
            if (err) return next(err);
            if (rows.length != 0) {
              console.log("nameGroup");
              var groupName = rows[0].name;
              console.log(req.params.id);
              db.query("SELECT persons.second_name as secondname, persons.last_name as lastname, persons.first_name as firstname, persons.BirthYear as birthyear, students.id as stid FROM persons INNER JOIN students ON students.id_person=persons.id WHERE students.id_group=?;", req.params.id, (err, rows) => {
                if (err) return next(err);
                rows.forEach(row => {
                  listStudents.push({
                    studentId: row.stid,
                    firstname: row.firstname,
                    lastname: row.lastname,
                    secondname: row.secondname,
                    birthyear: row.birthyear
                  });
                });
                res.render("attendance", {
                  groupName: groupName,
                  listStudents: listStudents,
                  login: login,
                  lastname: lastname,
                  firstname: firstname,
                  secondname: secondname,
                  type_user: type_user,
                  email: email
                });
              });
            } else res.redirect("/");
            db.release();
            if (err) return next(err);
          });
        }
        else res.redirect("/");
      }
    });
  });
});

/*

router.get('/attendance/:id',isLoggedIn, function(req, res, next) {
  var curGroup = []; var listStudents = [];
  pool.getConnection(function(err, db) {
    if (err) return next(err);
    var login,lastname,secondname,firstname,type_user,email = "";
    if (req.user){
      login = req.user.login;
      lastname = req.user.last_name;
      firstname = req.user.first_name;
      type_user = req.user.user_type;
      email = req.user.email;
      secondname = req.user.second_name;
    }
      db.query("SELECT name FROM studyGroups WHERE id=?",req.params.id, (err, rows) => {
      if (err) return next(err);
      var groupName = rows[0].name;
      var times = [];
      db.query("SELECT * FROM time", (err, rows) => {
        if (err) return next(err);
        rows.forEach(row => {
          times.push({ id: row.id, time: row.time });
        });
        console.log(req.params.id);
        db.query("SELECT persons.second_name as secondname, persons.last_name as lastname, persons.first_name as firstname, persons.BirthYear as birthyear, students.id as stid FROM persons INNER JOIN students ON students.id_person=persons.id WHERE students.id_group=?",req.params.id, (err, rows) => {
          if (err) return next(err);
          rows.forEach(row => {
            listStudents.push({ studentId: row.stid, firstname: row.firstname, lastname: row.lastname, secondname: row.secondname, birthyear: row.birthyear });
          });
          if (listStudents.length===0) res.render("attendance", {title: "Посещаемость группы",times: times,listStudents:listStudents,login: login,
            lastname: lastname,firstname: firstname,secondname: secondname,type_user: type_user,email: email,
            message: req.flash("У этой группы нет студентов") });
          else {
            db.query("SELECT * FROM schedule WHERE id_subjteacher IN (SELECT id FROM subjteacher WHERE id_group=?)",req.params.id, (err, rows) => {
              if (err) return next(err);
              if (rows) res.render("attendance", {title: "Посещаемость группы",
                times: times,listStudents: listStudents,groupName: groupName,login: login,
                lastname: lastname,firstname: firstname,secondname: secondname,type_user: type_user,email: email,
                message: req.flash("Для этой группы нет занятий") });
              else {
                rows.forEach(row => {
                  curGroup.push({ id: row.id, dayOfWeek: row.dayOfWeek, numPar: row.numPair, typeWeek: row.typeWeek, subjteacher: row.id_subjteacher, semester: row.id_semester, teacher: row.id_teacher, subject: row.idsubject });
                });
                var subjteachersarr = curGroup.map(function (el) { return el.subjteacher; });
                console.log("curGro "+curGroup);
                var subjects = [];
                //db.query("SELECT name from subjects WHERE id IN (SELECT id_subject FROM subjteacher WHERE id In ("+subjteachersarr+"));", (err, rows) => {
                db.query("SELECT name from subjects WHERE id IN (SELECT id_subject FROM subjteacher WHERE id In ("+subjteachersarr+"));", (err, rows) => {
                  if (err) return next(err);
                  console.log(rows);
                  /*
                  rows.forEach(row => {
                      subjects.push({ id: row.id, name: row.name });
                  });*/ /*
                  var teachers = [];
                  db.query("SELECT * FROM persons WHERE id IN (SELECT id_person FROM teachers)", (err, rows) => {
                    if (err) return next(err);
                    rows.forEach(row => {
                      teachers.push({ id: row.id, firstname: row.first_name, secondname: row.second_name, lastname: row.flast_name });
                    });
                    var typesubject = [];
                    db.query("SELECT * FROM typesubject", (err, rows) => {
                      if (err) {
                        return next(err);
                      }
                      rows.forEach(row => {
                        typesubject.push({ id: row.id, name: row.name });
                      });
                        var semester = [];
                        db.query("SELECT * FROM semester", (err, rows) => {
                          if (err) {
                            return next(err);
                          }
                          rows.forEach(row => {
                            semester.push({ id: row.id, start: row.start, end: row.end, name: row.name });
                          });
                          res.render("attendance", {title: "Посещаемость группы",
                            times: times,
                            subjects: subjects,
                            teachers: teachers,
                            typesubject: typesubject, groupName: groupName,
                            semester: semester,
                            listStudents: listStudents,
                            login: login,
                            lastname: lastname,
                            firstname: firstname,
                            secondname: secondname,
                            type_user: type_user,
                            email: email });
                        });
                    });
                  });
                });
              }
            });
          }
        });
      });
      db.release();
      if (err) return next(err);
    });
  });
});
*/


function getWeek(begin_date,week,selectedDate) {
  var day = ("Воскресенье", "Понедельник", "Вторник",
      "Среда", "Четверг", "Пятница", "Суббота");
  var d = new Date();
  var month = ["января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"];

  var TODAY = day[d.getDay()] + " " + d.getDate() + " " + month[d.getMonth()]
      + " " + d.getFullYear() + " г.";

  var info,curweek;

  var startWeek = week;

  var dateCurrent = new Date(selectedDate);

  var dateBegin  = new Date(begin_date);
  var timeBegin = dateBegin.getTime();
  var dayBegin = dateBegin.getDay();
  var differenceDay = Math.floor ((dateCurrent - timeBegin) / 8.64e7) + (dayBegin ? dayBegin - 1 : 6);

  var currentOfWeek =  (Math.floor(differenceDay / 7) % 2);
  if (currentOfWeek ===0){
    if(startWeek ==="Верхняя"){
      curweek = "Верхняя"
    }
    else{
      curweek = "Нижняя"
    }
  }
  else {
    if(startWeek ==="Верхняя"){
      curweek = "Нижняя"
    }
    else{
      curweek = "Верхняя"
    }
  }

  return curweek;
}

router.post("/fillSchedule", function(req, res, next) {
  //req.body.group  - AJAX data from /table
  var result = [];
  let str = `SELECT subjteacher.id as idSubjTeacher, subjteacher.id_subject, subjteacher.id_teacher, subjteacher.id_semester, subjteacher.id_group, 
    subjects.name as subjectName, subjteacher.type_subject as typeSubject, studyGroups.name as groupName, persons.second_name as secondname, 
    persons.last_name as lastname, persons.first_name as firstname, schedule.id as schid, schedule.dayOfWeek, schedule.numPair, schedule.typeWeek
    FROM subjteacher 
    INNER JOIN subjects ON subjects.id=subjteacher.id_subject
    INNER JOIN studyGroups ON studyGroups.id=subjteacher.id_group
    INNER JOIN teachers ON teachers.id=subjteacher.id_teacher  
    INNER JOIN persons ON persons.id=teachers.id_person
    INNER JOIN schedule ON subjteacher.id=schedule.id_subjteacher
    WHERE id_group=? and id_semester=? and dayOfWeek=? and typeWeek in (?) ORDER BY dayOfWeek, numPair`;
  //console.log(getCurrentWeek()); and dayofweek=? and typeweek=?
  pool.getConnection(function(err, db) {
    if (err) return next(err);
    db.query("SELECT * FROM semester WHERE start <= ? AND end >= ?;", [req.body.selecteddate, req.body.selecteddate], (err, rows) => {
      if (err) {
        return next(err);
      }
      else {
        var arr = ['Обе'];
        var week = getWeek(rows[0].start, rows[0].week,req.body.selecteddate);
        arr.push(week);
        var idSemester = rows[0].id;
        db.query(str, [req.body.id_group, idSemester, req.body.day,arr], (err, rows) => {
          if (err) {
            return next(err);
          } else {
            rows.forEach(row => {
              result.push({
                id: row.id,
                dayOfWeek: row.dayOfWeek,
                numPair: row.numPair,
                groupId: row.id_group,
                groupName: row.groupName,
                teacherId: row.id_teacher,
                teacherName: row.lastname +
                    " " + row.firstname +
                    " " + row.secondname,
                subjectId: row.id_subject,
                subjectName: row.subjectName,
                week: row.typeWeek,
                typeSubject: row.typeSubject,
                idSubjTeacher: row.idSubjTeacher
              });
            });
          }
          res.send(JSON.stringify(result));
          db.release();
          if (err) return next(err);
          // Don't use the db here, it has been returned to the pool.
        });
      }
    });
  });
});

router.post("/fillAttendance", function(req, res, next) {
  //req.body.group  - AJAX data from /table
  var result = [];
  let str = `SELECT * from studentattendance WHERE date_attendance=? and id_subjteacher IN (SELECT id FROM subjteacher WHERE id_group=? and id_semester=?)`;
  //console.log(getCurrentWeek()); and dayofweek=? and typeweek=?
  pool.getConnection(function(err, db) {
    if (err) return next(err);
    //var typeweek = getCurrentWeek();
    db.query("SELECT id FROM semester WHERE start <= ? AND end >= ?;", [req.body.selecteddate, req.body.selecteddate], (err, rows) => {
      if (err) {
        return next(err);
      }
      else {
        var idSemester = rows[0].id;
        db.query(str, [req.body.selecteddate,req.body.id_group, idSemester], (err, rows) => {
          if (err) {
            return next(err);
          } else {
            rows.forEach(row => {
              result.push({
                id: row.id,
                idStudent: row.id_student,
                attendance: row.attendance,
                idSubjTeacher: row.id_subjteacher,
                comment: row.comment
              });
            });
            console.log(result);
            res.send(JSON.stringify(result));
          }
          db.release();
          if (err) return next(err);
          // Don't use the db here, it has been returned to the pool.
        });
      }
    });
  });
});

router.post("/validateCode", function(req, res, next) {
  var result;
  var idSubjTeacher = req.body.idSubjTeacher;
  var code = req.body.code;
  var idSubject;
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query("SELECT approval_code FROM teachers WHERE id=(SELECT id_teacher FROM subjteacher WHERE id=?);", [idSubjTeacher], (err, rows) => {
      if (err) return next(err);
      console.log(rows[0].approval_code);
      if (rows[0].approval_code === code) result = 1;
      else result = 0;
      res.send({result: result});
    });
    db.release();
    if (err) return next(err);
  });
});

router.post("/saveAttendance", function(req, res, next) {
  var result = [];
  result = req.body;
  console.log(result);
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    /*
    for (var i = 0; i< result.length; i++) {
        db.query("INSERT INTO studentattendance(id_student, id_subjteacher, date_attendance, attendance) VALUES (?,?,?,?);", [result[i].idStudent, result[i].idSubject, result[i].date, result[i].attendance], (err, rows) => {
            if (err) return next(err);

        db.query("INSERT INTO studentattendance(id_student, id_subjteacher, date_attendance, attendance) VALUES (?,?,?,?);", [result[i].idStudent, result[i].idSubject, result[i].date, result[i].attendance], (err, rows) => {
            if (err) return next(err);
        });
        });
    }*/

    async function checkIfExist(idStudent, idSubject, date) {
      return new Promise(function(res) {
        db.query("SELECT id FROM studentattendance where id_student=? AND id_subjteacher=? AND date_attendance=?;", [idStudent, idSubject, date], function (err, rows) {
          console.log("1 " + idStudent, idSubject, date);
          if (err) return next(err);
          if (rows.length === 0) res(0);
          else res(rows[0].id);
        });
      })
    }

    async function updateAttendance(attendance,id) {
      return new Promise(function(res) {
        db.query("UPDATE studentattendance SET attendance=? WHERE id=?;", [attendance,id], (err) => {
          console.log("studentattendance updated");
          if (err) console.log(err);
          res();
        })
      })
    }

    async function insertIntoAttendance(idStudent, idSubject, date, attendance) {
      return new Promise(function(res) {
        db.query("INSERT INTO studentattendance(id_student, id_subjteacher, date_attendance, attendance) VALUES (?,?,?,?);", [idStudent, idSubject, date, attendance], (err) => {
          console.log("inserted into studentattendance")
          if (err) console.log(err);
          res();
        })
      })
    }

    async function save() {
      for (var i = 0; i< result.length; i++){
        var res;
        res = await checkIfExist(result[i].idStudent, result[i].idSubject, result[i].date);
        console.log("res "+res);
        if (res === 0) insertIntoAttendance(result[i].idStudent, result[i].idSubject, result[i].date, result[i].attendance);
        else updateAttendance(result[i].attendance, res);
      }
    }
    save();
    res.sendStatus(200);
    db.release();
    if (err) return next(err);
  });
});

router.post("/getTeachersName", function(req, res, next) {
    var result=[];
    var idSubjTeacher = req.body.idSubjTeacher;
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query("SELECT first_name, last_name,second_name FROM persons WHERE id=(SELECT id_person FROM teachers WHERE id=(SELECT id_teacher FROM subjteacher WHERE id=?));", [idSubjTeacher], (err, rows) => {
            if (err) return next(err);
            console.log(rows);
            rows.forEach(row => {
                result.push({
                    firstname: row.first_name,
                    secondname: row.second_name,
                    lastname: row.last_name
                });
            });
            res.send(JSON.stringify(result));
        });
        db.release();
        if (err) return next(err);
    });
});

router.get('/attCurator/:id',isLoggedIn, function(req, res, next) {
  var listStudents = [];
  pool.getConnection(function(err, db) {
    if (err) return next(err);
    var login,lastname,secondname,firstname,type_user,email = "";
    if (req.user){
      login = req.user.login;
      lastname = req.user.last_name;
      firstname = req.user.first_name;
      type_user = req.user.user_type;
      email = req.user.email;
      secondname = req.user.second_name;
    }
    //проверка принадлежит ли куратор к этой группе
    db.query("SELECT id FROM groupcurator WHERE id_curator=(SELECT id FROM curators WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?))) AND id_group=?;",[login,req.params.id], (err, rows) => {
      if (err) return next(err);
      if (rows.length != 0) {
        db.query("SELECT name FROM studyGroups WHERE id=?;", req.params.id, (err, rows) => {
          if (err) return next(err);
          if (rows.length != 0) {
            var groupName = rows[0].name;
            db.query("SELECT persons.second_name as secondname, persons.last_name as lastname, persons.first_name as firstname, persons.BirthYear as birthyear, students.id as stid FROM persons INNER JOIN students ON students.id_person=persons.id WHERE students.id_group=?;", req.params.id, (err, rows) => {
              if (err) return next(err);
              rows.forEach(row => {
                listStudents.push({
                  studentId: row.stid,
                  firstname: row.firstname,
                  lastname: row.lastname,
                  secondname: row.secondname,
                  birthyear: row.birthyear
                });
              });
              res.render("attCurator", {
                groupName: groupName,
                listStudents: listStudents,
                login: login,
                lastname: lastname,
                firstname: firstname,
                secondname: secondname,
                type_user: type_user,
                email: email
              });
            });
          } else res.redirect("/");
          db.release();
          if (err) return next(err);
        });
      }
      else res.redirect("/");
    });
  });
});

module.exports = router;
