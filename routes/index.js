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
    res.redirect("/login");
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
  res.redirect("/login");
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

router.get('/register',isLoggedIn, function(req, res, next) {
    result = [];
    pool.getConnection(function(err, db) {
      if (err) return next(err); // not connected!
        var studyGroups = [];
        var login,lastname,secondname,firstname,type_user,email = "";
        if (req.user){
            login = req.user.login;
            lastname = req.user.last_name;
            firstname = req.user.first_name;
            type_user = req.user.user_type;
            email = req.user.email;
            secondname = req.user.second_name;
        }
        db.query("SELECT isAdmin FROM curators WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?))",[login], (err, rows) => {
            if (err) return next(err);
            if (rows.length != 0 && rows[0].isAdmin===1 ) {
                db.query("SELECT * FROM studyGroups ORDER BY name", (err, rows) => {
                    if (err) {
                        return next(err);
                    }
                    rows.forEach(row => {
                        studyGroups.push({id: row.id, name: row.name});
                    });
                    res.render("register", {
                        title: "Регистрация", login: login,
                        lastname: lastname,
                        firstname: firstname,
                        secondname: secondname,
                        type_user: type_user,
                        email: email, studyGroups: studyGroups, message: req.flash("registerMessage")
                    });
                });
            }
            else res.redirect("/");
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

router.get('/parentPermission',isLoggedIn, function(req, res, next) {
    result = [];
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var studyGroups = [];
        var login,lastname,secondname,firstname,type_user,email = "";
        if (req.user){
            login = req.user.login;
            lastname = req.user.last_name;
            firstname = req.user.first_name;
            type_user = req.user.user_type;
            email = req.user.email;
            secondname = req.user.second_name;
        }
        var idStudent, permited, psn,pln,pfn;
        db.query("SELECT students.id, YEAR(CURDATE()) - YEAR(persons.birthYear) AS age" +
            "    FROM students " +
            "    INNER JOIN persons ON students.id_person=persons.id" +
            "    INNER JOIN users ON persons.id_user=users.id" +
            "    WHERE users.login=?;", [login], (err, rows) => {
            if (err) return next(err);
            if (rows.length != 0 && rows[0].age>=18 ) {
                idStudent = rows[0].id;
                db.query("SELECT persons.second_name as secondname, persons.last_name as lastname, persons.first_name as firstname, parentstudent.permited" +
                    "    FROM parentstudent " +
                    "    INNER JOIN parents ON parentstudent.id_parent=parents.id" +
                    "    INNER JOIN persons ON parents.id_person=persons.id" +
                    "    WHERE id_student=?;", [idStudent], (err, rows) => {
                    if (err) return next(err);
                    if (rows.length != 0) {
                        permited = rows[0].permited;
                        psn = rows[0].secondname;
                        pln = rows[0].lastname;
                        pfn = rows[0].firstname;
                        res.render("parentPermission", {idStudent: idStudent, login: login,
                            lastname: lastname,
                            firstname: firstname,
                            secondname: secondname,
                            psn: psn, pln: pln, pfn: pfn,permited: permited,
                            type_user: type_user,
                            email: email
                        });
                    }
                    else {idStudent = 0;
                        res.render("parentPermission", {idStudent: idStudent, login: login,
                            title: "Изменить разрешение",lastname: lastname,
                            firstname: firstname,
                            secondname: secondname,
                            psn: psn, pln: pln, pfn: pfn,
                            type_user: type_user,
                            email: email
                        });
                    }
                });
            }
            else {idStudent = 0;
            res.render("parentPermission", {idStudent: idStudent, login: login,
                lastname: lastname,
                firstname: firstname,
                secondname: secondname,
                psn: psn, pln: pln, pfn: pfn,
                type_user: type_user,
                email: email
            });
            }
        });
        db.release();
        if (err) return next(err);
    });
});

router.post("/parentPermission", function(req, res, next) {
    var permission;
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var login = "";
        if (req.user){
            login = req.user.login;
        }
        if (req.body.permission==="on") permission = 0;
        else permission =1;
        db.query("UPDATE parentstudent SET permited=? WHERE id_student=(SELECT id FROM students WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?)))",[permission,login], (err, rows) => {
            if (err) return next(err);
            res.redirect("/");
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



router.get("/listSchedule/:id", function(req, res, next) {
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
    WHERE id_group=? ORDER BY dayOfWeek, numPair`;
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query(str, [req.params.id], (err, rows) => {
            if (err) return next(err);
            var times =["8:30","10:10", "11:50", "13:50", "15:30", "17:10", "18:50"];
            var days =["Пн","Вт", "Ср", "Чт", "Пт", "Сб"];
            rows.forEach(row => {
                result.push({
                    id: row.schid,
                    dayOfWeek: days[row.dayOfWeek-1],
                    numPair: times[row.numPair-1],
                    groupName: row.groupName,
                    teacherName: row.lastname +
                        " " + row.firstname +
                        " " + row.secondname,
                    subjectName: row.subjectName,
                    week: row.typeWeek,
                    typeSubject: row.typeSubject,
                    idSubjTeacher: row.idSubjTeacher
                });
            });
            res.render("listSchedule", {title: "Редактирование распиания",
                result: result });
            db.release();
            if (err) return next(err);
        });
    });
});

router.get("/schedule/:id", function(req, res, next) {
    var result = [];
    let str = `SELECT subjteacher.id as idSubjTeacher, subjteacher.id_subject, subjteacher.id_teacher, subjteacher.id_semester, subjteacher.id_group, 
    subjects.name as subjectName, subjteacher.type_subject as typeSubject, studyGroups.name as groupName, persons.second_name as secondname, 
    persons.last_name as lastname, persons.first_name as firstname, schedule.id as schId, schedule.dayOfWeek, schedule.numPair, schedule.typeWeek
    FROM subjteacher 
    INNER JOIN subjects ON subjects.id=subjteacher.id_subject
    INNER JOIN studyGroups ON studyGroups.id=subjteacher.id_group
    INNER JOIN teachers ON teachers.id=subjteacher.id_teacher  
    INNER JOIN persons ON persons.id=teachers.id_person
    INNER JOIN schedule ON subjteacher.id=schedule.id_subjteacher
    WHERE schedule.id=?`;
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        var subjects=[]; var studygroups = [];
        db.query(str, [req.params.id], (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({
                    id: row.schId,
                    dayOfWeek: row.dayOfWeek,
                    numPair: row.numPair,
                    groupName: row.groupName,
                    lastname: row.lastname,
                    firstname : row.firstname,
                    secondname:  row.secondname,
                    subjectName: row.subjectName,
                    week: row.typeWeek,
                    typeSubject: row.typeSubject,
                    idSubjTeacher: row.idSubjTeacher,
                    semester: row.id_semester
                });
            });
            db.query("SELECT * FROM studyGroups WHERE id=(SELECT id_group FROM subjteacher WHERE id=(SELECT id_subjteacher FROM schedule WHERE id=?))",[req.params.id], (err, rows) => {
                if (err) return next(err);
                rows.forEach(row => {
                    studygroups.push({ id: row.id, name: row.name });
                });
                db.query("SELECT * FROM subjects ORDER BY name", (err, rows) => {
                    if (err) return next(err);
                    rows.forEach(row => {
                        subjects.push({ id: row.id, name: row.name });
                    });
                    var teachers = [];
                    db.query("SELECT * FROM persons WHERE id IN (SELECT id_person FROM teachers) ORDER BY last_name", (err, rows) => {
                        if (err) return next(err);
                        rows.forEach(row => {
                            teachers.push({ id: row.id, firstname: row.first_name, secondname: row.second_name, lastname: row.last_name });
                        });
                        var semester = [];
                        db.query("SELECT * FROM semester", (err, rows) => {
                            if (err) return next(err);
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
                            res.render("schedule", {title: "Редактирование распиания",
                                subjects: subjects,
                                teachers: teachers,
                                studyGroups: studygroups,
                                res: result[0],
                                semester: semester });
                        });
                    });
                });
            });
        });
        db.release();
        if (err) return next(err);
    });
});

router.post("/schedule/:id", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("UPDATE schedule,subjteacher SET schedule.dayOfWeek=?,schedule.numPair=?,schedule.typeWeek=?, " +
            "subjteacher.id_subject=?, subjteacher.id_teacher=?, subjteacher.type_subject=?, subjteacher.id_semester=? "+
            "WHERE subjteacher.id=schedule.id_subjteacher AND schedule.id=?;",[req.body.weekday,req.body.time,req.body.typeWeek,req.body.subject,req.body.teacher,req.body.typeSubject,req.body.semester, req.params.id], function (err) {
            if (err) return next(err);
            db.query("SELECT id_group FROM subjteacher INNER JOIN schedule ON subjteacher.id=schedule.id_subjteacher AND schedule.id=?;",[req.params.id], function (err,rows) {
                if (err) return next(err);
                res.redirect("/listSchedule/"+rows[0].id_group);
            });
        });
        db.release();
        if (err) return next(err);
    });
});

router.get("/delSchedule/:id", function(req, res, next) {
    var result = [];
    let str = `SELECT subjteacher.id as idSubjTeacher, subjteacher.id_subject, subjteacher.id_teacher, subjteacher.id_semester, subjteacher.id_group as groupId, 
    subjects.name as subjectName, subjteacher.type_subject as typeSubject, studyGroups.name as groupName, persons.second_name as secondname, 
    persons.last_name as lastname, persons.first_name as firstname, schedule.id as schid, schedule.dayOfWeek, schedule.numPair, schedule.typeWeek
    FROM subjteacher 
    INNER JOIN subjects ON subjects.id=subjteacher.id_subject
    INNER JOIN studyGroups ON studyGroups.id=subjteacher.id_group
    INNER JOIN teachers ON teachers.id=subjteacher.id_teacher  
    INNER JOIN persons ON persons.id=teachers.id_person
    INNER JOIN schedule ON subjteacher.id=schedule.id_subjteacher
    WHERE schedule.id=?`;
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query(str, [req.params.id], (err, rows) => {
            if (err) return next(err);
            var times =["8:30","10:10", "11:50", "13:50", "15:30", "17:10", "18:50"];
            var days =["Пн","Вт", "Ср", "Чт", "Пт", "Сб"];
            rows.forEach(row => {
                result.push({
                    id: row.schid,
                    dayOfWeek: days[row.dayOfWeek-1],
                    numPair: times[row.numPair-1],
                    groupId: row.groupId,
                    groupName: row.groupName,
                    teacherName: row.lastname +
                        " " + row.firstname +
                        " " + row.secondname,
                    subjectName: row.subjectName,
                    week: row.typeWeek,
                    typeSubject: row.typeSubject,
                    idSubjTeacher: row.idSubjTeacher
                });
            });
            res.render("delSchedule", {title: "Удаление распиания",
                val: result[0] });
            db.release();
            if (err) return next(err);
        });
    });
});

router.post("/delSchedule/:id", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("SELECT id_group FROM subjteacher WHERE id=?;",[req.params.id], function (err,rows) {
            if (err) return next(err);
            var idGroup=rows[0].id_group;
            db.query("DELETE FROM subjteacher WHERE id=?;", req.params.id, (err) => {
                if (err) return next(err);
                res.redirect("/listSchedule/"+idGroup);
            });
        });
        db.release();
        if (err) return next(err);
    });
});

module.exports = router;
