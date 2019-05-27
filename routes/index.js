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

router.get("/login", function(req, res, next) {
  res.render("login", {
    title: "Login",
    message: req.flash("loginMessage")
  });
});

router.post("/login", passport.authenticate("local-login", {
    successRedirect: "/", // redirect to the secure profile section
    failureRedirect: "/login", // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  })
);

router.get("/logout", function(req, res, next) {
  req.logout();
  res.redirect("/");
});

/* GET home page. */
router.get('/', isLoggedIn, function(req, res, next) {
	var login,lastname,firstname,secondname,type_user,email = "";
	login = req.user.login;
	lastname = req.user.last_name;
	firstname = req.user.first_name;
	type_user = req.user.user_type;
	email = req.user.email;
	secondname = req.user.second_name;
	console.log(req.user)

    res.render("index", {
    title: "Главная",
    login: login,
    lastname: lastname,
    firstname: firstname,
    secondname: secondname,
    type_user: type_user,
    email: email
  });
});

router.get('/register', function(req, res, next) {
    result = [];
    pool.getConnection(function(err, db) {
      if (err) return next(err); // not connected!
        var studyGroups = [];
        db.query("SELECT * FROM studyGroups ORDER BY name", (err, rows) => {
          if (err) {
            return next(err);
          }
          rows.forEach(row => {
            studyGroups.push({ id: row.id, name: row.name });
          });
          	var login,lastname,secondname,firstname,type_user,email = "";
          if (req.user){
			login = req.user.login;
			lastname = req.user.last_name;
			firstname = req.user.first_name;
			type_user = req.user.user_type;
			email = req.user.email;
			secondname = req.user.second_name;
		  }
		  res.render("register", {title: "Регистрация", login: login,
		    lastname: lastname,
		    firstname: firstname,
		    secondname: secondname,
		    type_user: type_user,
		    email: email,studyGroups: studyGroups, message: req.flash("registerMessage")});
        });
        db.release();
        if (err) return next(err);
    });
});

router.post("/register", passport.authenticate("local-signup", {
    successRedirect: "/", //member page
    failureRedirect: "/register", //failed login
    failureFlash: true //flash msg
  })
);

router.post("/regStudents", function(req, res, next) {//для регистрации
    console.log(req.body.studyGroup);
    var result = [];
    var result2 = [];
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        //db.query(`SELECT * from persons WHERE id IN (SELECT id_person from students WHERE id_group = (SELECT id from studygroups WHERE name =?)) ;`, [req.body.studyGroup], (err, rows) => {
        db.query(`SELECT * FROM (SELECT id_person, id as idSt from students WHERE id_group = (SELECT id from studygroups WHERE name =?)) AS s 
                    INNER JOIN persons on persons.id = s.id_person;`, [req.body.studyGroup], (err, rows) => {
            if (err) {
                return next(err);
            } else {
                //console.log("rows "+rows);
                rows.forEach(row => {
                    result.push({
                        id: row.id,
                        idSt: row.idSt,
                        fullName:row.last_name + " " +row.first_name + " " +row.second_name
                    });
                });
            }
            console.log(result)
            res.send(JSON.stringify(result));
            db.release();
            if (err) return next(err);
        });
    });
});

router.get('/table', function(req, res, next) {
    var studyGroups = [];
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        //db.query("SELECT column_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'typeUser';", (err, rows) => {
        db.query("SELECT * FROM studyGroups ORDER BY name", (err, rows) => {
            if (err) {
                return next(err);
            }
            rows.forEach(row => {
                studyGroups.push({ id: row.id, name: row.name });
            });
            var weekday = [];
            db.query("SELECT * FROM weekdays", (err, rows) => {
                if (err) {
                    return next(err);
                }
                rows.forEach(row => {
                    weekday.push({ id: row.id, name: row.name });
                });
                var times = [];
                db.query("SELECT * FROM time", (err, rows) => {
                    if (err) {
                        return next(err);
                    }
                    rows.forEach(row => {
                        times.push({ id: row.id, time: row.time });
                    });
                    var subjects = [];
                    db.query("SELECT * FROM subjects ORDER BY name", (err, rows) => {
                        if (err) {
                            return next(err);
                        }
                        rows.forEach(row => {
                            subjects.push({ id: row.id, name: row.name });
                        });
                        var teachers = [];
                        db.query("SELECT * FROM persons WHERE id IN (SELECT id_person FROM teachers)", (err, rows) => {
                            if (err) {
                                return next(err);
                            }
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
                                var typeweek = [];
                                db.query("SELECT * FROM typeweek", (err, rows) => {
                                    if (err) {
                                        return next(err);
                                    }
                                    rows.forEach(row => {
                                        typeweek.push({ id: row.id, name: row.name });
                                    });
                                    var semester = [];
                                    db.query("SELECT * FROM semester", (err, rows) => {
                                        if (err) {
                                            return next(err);
                                        }
                                        rows.forEach(row => {
                                            semester.push({ id: row.id, start: row.start, end: row.end, name: row.name });
                                        });
                                    var login,lastname,secondname,firstname,type_user,email = "";
                                    if (req.user){
                                        login = req.user.login;
                                        lastname = req.user.last_name;
                                        firstname = req.user.first_name;
                                        type_user = req.user.user_type;
                                        email = req.user.email;
                                        secondname = req.user.second_name;
                                    }
                                    res.render("scheduleEdit", {title: "Редактирование распиания",
                                        studyGroups: studyGroups,
                                        weekday: weekday,
                                        times: times,
                                        subjects: subjects,
                                        teachers: teachers,
                                        typesubject: typesubject,
                                        typeweek: typeweek,
                                        semester: semester,
                                        login: login,
                                        lastname: lastname,
                                        firstname: firstname,
                                        secondname: secondname,
                                        type_user: type_user,
                                        email: email,
                                        message: req.flash("registerMessage") });
                                    });
                                });
                            });
                        });
                    });
                });
            });
            db.release();
            if (err) return next(err);
        });
    });
});
/*
router.post("/table", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("SELECT id FROM teachers WHERE id_person=?;",[req.body.teacher], function (err, row) {
            if (err) return next(err);
            else { var idTeacher = row[0].id;
                db.query(`INSERT INTO subjteacher(id_subject, id_teacher, type_subject) VALUES (?,?,?);`,[req.body.subject,idTeacher,req.body.typeSubject], err => {
                    if (err) return next(err);
                    else {
                        db.query("SELECT id FROM subjteacher ORDER BY id DESC LIMIT 1;", function (err, row) {
                            if (err) return next(err);
                            var idSubjTeacher = row[0].id;
                            if (idSubjTeacher != 0) {
                                db.query("INSERT into schedule (id_group,dayOfWeek,numPair,typeWeek,id_subjteacher,id_semester) values (?,?,?,?,?,?);", [req.body.selectStudyGroup, req.body.weekday, req.body.time, req.body.typeWeek, idSubjTeacher, req.body.semester], function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    console.log("inserted into schedule");
                                })
                            }
                        });
                    }
                    res.redirect("/table");
                });
            }
        });
        db.release();
        if (err) return next(err);
    });
});*/



router.post("/table", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("SELECT id FROM teachers WHERE id_person=?;",[req.body.teacher], function (err, row) {
            if (err) return next(err);
            else { var idTeacher = row[0].id;
                db.query(`INSERT INTO subjteacher(id_subject, id_teacher, type_subject, id_semester, id_group) VALUES (?,?,?,?,?);`,[req.body.subject,idTeacher,req.body.typeSubject,req.body.semester,req.body.selectStudyGroup], err => {
                    if (err) return next(err);
                    else {
                        db.query("SELECT id FROM subjteacher ORDER BY id DESC LIMIT 1;", function (err, row) {
                            if (err) return next(err);
                            var idSubjTeacher = row[0].id;
                            if (idSubjTeacher != 0) {
                                db.query("INSERT into schedule (dayOfWeek,numPair,typeWeek,id_subjteacher) values (?,?,?,?);", [req.body.weekday, req.body.time, req.body.typeWeek, idSubjTeacher], function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    console.log("inserted into schedule");
                                })
                            }
                        });
                    }
                    res.redirect("/table");
                });
            }
        });
        db.release();
        if (err) return next(err);
    });
});

router.get("/reports", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var login,lastname,firstname,secondname,type_user,email = "";
        var studyGroups = []; var sqlgroups; var idTeacher, idStudent,idParent;
        if (req.user){
            login = req.user.login;
            lastname = req.user.last_name;
            firstname = req.user.first_name;
            type_user = req.user.user_type;
            email = req.user.email;
            secondname = req.user.second_name;
        }
        if (type_user==="Преподаватель") {
            idStudent = 0;
            idParent = 0;
            sqlgroups ="SELECT id,name FROM studyGroups WHERE id IN (SELECT id_group FROM subjteacher WHERE id_teacher=(SELECT id FROM teachers WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?))))";
            db.query("SELECT id FROM teachers WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?))",[login], (err, rows) => {
                if (err) return next(err);
                idTeacher = rows[0].id;
            });
        }
        if (type_user==="Куратор") {
            idTeacher = 0;
            idStudent = 0;
            idParent = 0;
            sqlgroups = "SELECT id,name FROM studygroups WHERE id IN (SELECT id_group FROM groupcurator WHERE id_curator=(SELECT id FROM curators WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?))))";
        }
        if (type_user==="Студент") {
            idTeacher = 0;
            idParent = 0;
            sqlgroups = "SELECT id,name FROM studygroups WHERE id=(SELECT id_group FROM students WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?)))";
            db.query("SELECT id FROM students WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?))",[login], (err, rows) => {
                if (err) return next(err);
                idStudent = rows[0].id;
            });
        }
        if (type_user==="Родитель") {
            idTeacher = 0;
            idStudent = 0;
            sqlgroups = "SELECT id,name FROM studygroups WHERE id IN (SELECT id_group FROM students WHERE id IN (SELECT id_student FROM parentstudent WHERE id_parent=(SELECT id FROM parents WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?)))))";
            db.query("SELECT id FROM parents WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?))",[login], (err, rows) => {
                if (err) return next(err);
                idParent = rows[0].id;
            });
        }
        db.query(sqlgroups,[login], (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                studyGroups.push({ id: row.id, name: row.name });
            });
            res.render("reports", {
                title: "Отчеты",
                login: login,
                lastname: lastname,
                firstname: firstname,
                secondname: secondname,
                type_user: type_user,
                email: email,
                studyGroups: studyGroups,
                idTeacher: idTeacher,
                idStudent: idStudent,
                idParent: idParent
            });
        });
        db.release();
        if (err) return next(err);
    });
});

router.post("/studentsListReport", function(req, res, next) {
    var studentsList = [];
    var idGroup = req.body.idGroup;
    var idStudent = req.body.idStudent;
    var idParent = req.body.idParent;
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        if (idStudent==="0" && idParent === "0") {
            db.query("SELECT persons.second_name as secondname, persons.last_name as lastname, persons.first_name as firstname, students.id as stId" +
                "    FROM students " +
                "    INNER JOIN persons ON students.id_person=persons.id" +
                "    WHERE id_group=?;", [idGroup], (err, rows) => {
                if (err) return next(err);
                rows.forEach(row => {
                    studentsList.push({
                        id: row.stId,
                        lastname: row.lastname,
                        firstname: row.firstname,
                        secondname: row.secondname
                    });
                });
                res.send(JSON.stringify(studentsList));
            });
        }
        else {
            if (idStudent!="0" && idParent === "0") {//если студент
                db.query("SELECT persons.second_name as secondname, persons.last_name as lastname, persons.first_name as firstname, students.id as stId \n" +
                    "FROM students \n" +
                    "INNER JOIN persons ON students.id_person=persons.id \n" +
                    "WHERE students.id=?;", [idStudent], (err, rows) => {
                    if (err) return next(err);
                    rows.forEach(row => {
                        studentsList.push({
                            id: row.stId,
                            lastname: row.lastname,
                            firstname: row.firstname,
                            secondname: row.secondname
                        });
                    });
                    res.send(JSON.stringify(studentsList));
                });
            }
            else {//если родитель
                if (idStudent==="0" && idParent != "0") {
                    db.query("SELECT persons.second_name as secondname, persons.last_name as lastname, persons.first_name as firstname, students.id as stId \n" +
                        "FROM students \n" +
                        "INNER JOIN persons ON students.id_person=persons.id\n" +
                        "INNER JOIN parentstudent ON students.id=parentstudent.id_student\n" +
                        "WHERE students.id_group=? AND parentstudent.id_parent=?;", [idGroup, idParent], (err, rows) => {
                        if (err) return next(err);
                        rows.forEach(row => {
                            studentsList.push({
                                id: row.stId,
                                lastname: row.lastname,
                                firstname: row.firstname,
                                secondname: row.secondname
                            });
                        });
                        res.send(JSON.stringify(studentsList));
                    });
                }
            }
        }
        db.release();
        if (err) return next(err);
    });
});

router.post("/subjectsListReport", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var subjectsList = [];
        console.log("subjectsList");
        var idTeacher = req.body.idTeacher;
        var idGroup = req.body.idGroup;
        console.log(idTeacher);
        if (idTeacher==="0") {
            db.query("SELECT id,name FROM subjects WHERE id IN (SELECT id_subject FROM subjteacher WHERE id_group=?);",[idGroup], (err, rows) => {
                if (err) return next(err);
                console.log("1");
                rows.forEach(row => {
                    subjectsList.push({ id: row.id, name: row.name});
                });
                res.send(JSON.stringify(subjectsList));
            });
        }
        else {
            db.query("SELECT id,name FROM subjects WHERE id IN (SELECT id_subject FROM subjteacher WHERE id_group=? AND id_teacher=?);",[idGroup,idTeacher], (err, rows) => {
                if (err) return next(err);
                console.log("2");
                rows.forEach(row => {
                    subjectsList.push({ id: row.id, name: row.name});
                });
                res.send(JSON.stringify(subjectsList));
            });
        }
        db.release();
        if (err) return next(err);
    });
});

router.post("/getReport", function(req, res, next) {
    var result=[];
    //req.body.beginDate, req.body.endDate, req.body.idGroup, req.body.idSubject, req.body.idStudent
    console.log(req.body.beginDate, req.body.endDate, req.body.idGroup, req.body.idSubject, req.body.idStudent, req.body.studentId);
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        if (req.body.idSubject === "0" && req.body.idStudent === "0" && req.body.studentId==="0") {//ПОСЕЩАЕМОСТЬ ГРУППЫ ЗА ОПРЕДЕЛЕННЫЙ ПЕРИОД
            db.query("SELECT * FROM studentattendance WHERE id_subjteacher IN (SELECT id FROM subjteacher WHERE id_group=?) AND date_attendance BETWEEN ? AND ?;",[req.body.idGroup,req.body.beginDate,req.body.endDate], (err, rows) => {
                if (err) return next(err);
                //console.log(rows);
                console.log("1");
                rows.forEach(row => {
                    result.push({ id: row.id, attendance: row.attendance, dateAtt: row.date_attendance});
                });
                res.send(JSON.stringify(result));
            });
        }
        else {
            if (req.body.idStudent === "0" && req.body.idSubject != "0" && req.body.studentId==="0") {//ПОСЕЩАЕМОСТЬ ГРУППЫ ЗА ОПРЕДЕЛЕННЫЙ ПЕРИОД (ПО ПРЕДМЕТУ)
                db.query("SELECT * FROM studentattendance WHERE id_subjteacher IN (SELECT id FROM subjteacher WHERE id_group=? AND id_subject=?) AND date_attendance BETWEEN ? AND ?;",[req.body.idGroup,req.body.idSubject,req.body.beginDate,req.body.endDate], (err, rows) => {
                    if (err) return next(err);
                    //console.log(rows);
                    console.log("2");
                    rows.forEach(row => {
                        result.push({ id: row.id, attendance: row.attendance, dateAtt: row.date_attendance});
                    });
                    res.send(JSON.stringify(result));
                });
            }
            else {
                if (req.body.idStudent != "0" && req.body.idSubject === "0") {//ПОСЕЩАЕМОСТЬ СТУДЕНТА ЗА ОПРЕДЕЛЕННЫЙ ПЕРИОД
                    db.query("SELECT * FROM studentattendance WHERE id_subjteacher IN (SELECT id FROM subjteacher WHERE id_group=?) AND id_student=? AND date_attendance BETWEEN ? AND ?;",[req.body.idGroup,req.body.idStudent,req.body.beginDate,req.body.endDate], (err, rows) => {
                        if (err) return next(err);
                        console.log(rows);
                        console.log("3");
                        rows.forEach(row => {
                            result.push({ id: row.id, attendance: row.attendance, dateAtt: row.date_attendance});
                        });
                        res.send(JSON.stringify(result));
                    });
                }
                else {
                    if (req.body.idStudent != "0" && req.body.idSubject != "0") {//ПОСЕЩАЕМОСТЬ СТУДЕНТА ЗА ОПРЕДЕЛЕННЫЙ ПЕРИОД (ПО ПРЕДМЕТУ)
                        db.query("SELECT * FROM studentattendance WHERE id_subjteacher IN (SELECT id FROM subjteacher WHERE id_group=? AND id_subject=?) AND id_student=? AND date_attendance BETWEEN ? AND ?;",[req.body.idGroup,req.body.idSubject,req.body.idStudent,req.body.beginDate,req.body.endDate], (err, rows) => {
                            if (err) return next(err);
                            console.log(rows);
                            console.log("4");
                            rows.forEach(row => {
                                result.push({ id: row.id, attendance: row.attendance, dateAtt: row.date_attendance});
                            });
                            res.send(JSON.stringify(result));
                        });
                    }
                    else res.send(JSON.stringify(result))
                }
            }
        }
        db.release();
        if (err) return next(err);
    });
});

router.post("/getReportTable", function(req, ress, next) {
    var result=[];
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        function getAttCount(id,beginDate,endDate) {
            return new Promise(function(res) {
                db.query("SELECT COUNT(id) as res FROM studentattendance WHERE id_student=? AND date_attendance BETWEEN ? AND ?;",[id,beginDate,endDate], (err, rows) => {
                    if (err) console.log(err);
                    res(rows[0].res);
                })
            })
        }

        function getAttCount2(id,idSubject,beginDate,endDate) {
            return new Promise(function(res) {
                db.query("SELECT COUNT(id) as res FROM studentattendance WHERE id_student=? AND id_subjteacher IN (SELECT id FROM subjteacher WHERE id_subject=?) AND date_attendance BETWEEN ? AND ?;",[id,idSubject,beginDate,endDate], (err, rows) => {
                    if (err) console.log(err);
                    res(rows[0].res);
                })
            })
        }

        if (req.body.idSubject === "0" && req.body.idStudent === "0" && req.body.studentId==="0") {//ПОСЕЩАЕМОСТЬ ГРУППЫ ЗА ОПРЕДЕЛЕННЫЙ ПЕРИОД
            db.query("SELECT persons.second_name as secondname, persons.last_name as lastname, persons.first_name as firstname, students.id as stId \n" +
                "FROM students \n" +
                "INNER JOIN persons ON students.id_person=persons.id\n" +
                "WHERE students.id_group=?;",[req.body.idGroup], async (err, rows) => {
                if (err) return next(err);
                console.log("1");
                console.log(rows);
                rows.forEach(row => {
                    result.push({
                        stId: row.stId,
                        firstname: row.firstname,
                        lastname: row.lastname,
                        secondname: row.secondname
                    });
                });
                console.log("result " + result);
                var result2 = [];
                for (var i = 0; i < result.length; i++) {
                    var res = await getAttCount(result[i].stId,req.body.beginDate, req.body.endDate);
                    result2.push({
                        absent: res,
                        firstname: result[i].firstname,
                        lastname: result[i].lastname,
                        secondname: result[i].secondname
                    });
                }
                ress.send(JSON.stringify(result2));
                //res.send(JSON.stringify(result));
            });
        }
        else {
            if (req.body.idStudent === "0" && req.body.idSubject != "0" && req.body.studentId==="0") {//ПОСЕЩАЕМОСТЬ ГРУППЫ ЗА ОПРЕДЕЛЕННЫЙ ПЕРИОД (ПО ПРЕДМЕТУ)
                db.query("SELECT persons.second_name as secondname, persons.last_name as lastname, persons.first_name as firstname, students.id as stId \n" +
                    "FROM students \n" +
                    "INNER JOIN persons ON students.id_person=persons.id\n" +
                    "WHERE students.id_group=?;",[req.body.idGroup], async (err, rows) => {
                    if (err) return next(err);
                    //console.log(rows);
                    console.log("2");
                    rows.forEach(row => {
                        result.push({
                            stId: row.stId,
                            firstname: row.firstname,
                            lastname: row.lastname,
                            secondname: row.secondname
                        });
                    });
                    console.log("result " + result);
                    var result2 = [];
                    for (var i = 0; i < result.length; i++) {
                        var res = await getAttCount2(result[i].stId,req.body.idSubject, req.body.beginDate, req.body.endDate);
                        result2.push({
                            absent: res,
                            firstname: result[i].firstname,
                            lastname: result[i].lastname,
                            secondname: result[i].secondname
                        });
                    }
                    ress.send(JSON.stringify(result2));
                });
            }
            else ress.send(JSON.stringify(result));
        }
        db.release();
        if (err) return next(err);
    });
});

router.post("/getReportTable2", function(req, ress, next) {
    var result=[];
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
            if (req.body.idStudent != "0" && req.body.idSubject === "0") {//ПОСЕЩАЕМОСТЬ СТУДЕНТА ЗА ОПРЕДЕЛЕННЫЙ ПЕРИОД
                db.query("SELECT id,attendance,DATE_FORMAT(date_attendance, \"%d-%m-%Y\") as date, comment FROM studentattendance WHERE id_student=? AND date_attendance BETWEEN ? AND ?;",[req.body.idStudent,req.body.beginDate,req.body.endDate], (err, rows) => {
                    if (err) return next(err);
                    console.log(rows);
                    console.log("3");
                    rows.forEach(row => {
                        result.push({ id: row.id, attendance: row.attendance, dateAtt: row.date, comment: row.comment});
                    });
                    ress.send(JSON.stringify(result));
                });
            }
            else {
                if (req.body.idStudent != "0" && req.body.idSubject != "0") {//ПОСЕЩАЕМОСТЬ СТУДЕНТА ЗА ОПРЕДЕЛЕННЫЙ ПЕРИОД (ПО ПРЕДМЕТУ)
                    db.query("SELECT id,attendance,DATE_FORMAT(date_attendance, \"%d-%m-%Y\") as date, comment FROM studentattendance WHERE id_subjteacher IN (SELECT id FROM subjteacher WHERE id_group=? AND id_subject=?) AND id_student=? AND date_attendance BETWEEN ? AND ?;",[req.body.idGroup,req.body.idSubject,req.body.idStudent,req.body.beginDate,req.body.endDate], (err, rows) => {
                        if (err) return next(err);
                        //console.log(rows);
                        console.log("4");
                        rows.forEach(row => {
                            result.push({ id: row.id, attendance: row.attendance, dateAtt: row.date, comment: row.comment});
                        });
                        ress.send(JSON.stringify(result));
                    });
                }
                else ress.send(JSON.stringify(result));
            }
        db.release();
        if (err) return next(err);
    });
});

module.exports = router;
