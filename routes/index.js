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


router.get("/listGroup",isLoggedIn, function(req, res, next) {
  result = [];
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query("SELECT id, name, YEAR(year_admission) as year_admission FROM studyGroups ORDER BY name", (err, rows) => {
      if (err) {
        return next(err);
      }
      rows.forEach(row => {
          result.push({ id: row.id, name: row.name, yearAdmission: row.year_admission });
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
        res.render("listGroup", {
          title: "Список групп", studyGroup: result,login: login,
		    lastname: lastname,
		    firstname: firstname,
		    secondname: secondname,
		    type_user: type_user,
		    email: email
        });
    });
    db.release();
    if (err) return next(err);
  });
});

router.post("/addGroup", function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query(`INSERT INTO studyGroups(name,year_admission) VALUES ('${req.body.nameGroup}', '${req.body.yearAdmission}');`,err => {
        if (err) {
          return next(err);
        }
        res.redirect("/listGroup");
      }
    );
    db.release();
    if (err) return next(err);
    // Don't use the db here, it has been returned to the pool.
  });
});

router.get("/studygroup/:id", isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query("SELECT * FROM studyGroups WHERE id=?", req.params.id, (err, rows) => {
      if (err) {
        return next(err);
      }
      var login,lastname,secondname,firstname,type_user,email = "";
      if (req.user){
		login = req.user.login;
		lastname = req.user.last_name;
		firstname = req.user.first_name;
		type_user = req.user.user_type;
		email = req.user.email;
		secondname = req.user.second_name;
	  }
      res.render("studyGroup", {
        title: "Группа",
        val: rows[0],login: login,
		    lastname: lastname,
		    firstname: firstname,
		    secondname: secondname,
		    type_user: type_user,
		    email: email
      });
    });
    db.release();
    if (err) return next(err);
    // Don't use the db here, it has been returned to the pool.
  });
});

router.post("/studygroup/:id", isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query(
      `UPDATE studygroups SET name='${req.body.name}' WHERE id=?;`,
      req.params.id,
      (err, rows) => {
        if (err) {
          return next(err);
        }
        res.redirect("/listGroup");
      }
    );
    db.release();
    if (err) return next(err);
    // Don't use the db here, it has been returned to the pool.
  });
});

router.get("/delGroup/:id", isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query("SELECT * FROM studygroups WHERE id=?", req.params.id, (err, rows) => {
      if (err) {
        return next(err);
      }
      var login,lastname,secondname,firstname,type_user,email = "";
      if (req.user){
		login = req.user.login;
		lastname = req.user.last_name;
		firstname = req.user.first_name;
		type_user = req.user.user_type;
		email = req.user.email;
		secondname = req.user.second_name;
	  }
      res.render("delGroup", {
        title: "Группа",
        val: rows[0],login: login,
		    lastname: lastname,
		    firstname: firstname,
		    secondname: secondname,
		    type_user: type_user,
		    email: email
      });
    });
    db.release();
    if (err) return next(err);
    // Don't use the db here, it has been returned to the pool.
  });
});

router.post("/delGroup/:id", isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query(`DELETE FROM studygroups WHERE id=?;`, req.params.id, (err, rows) => {
      if (err) {
        return next(err);
      }
    });
    db.release();
    if (err) return next(err);
    // Don't use the db here, it has been returned to the pool.
  });
  res.redirect("/listGroup");
});

router.get("/listTeacher",isLoggedIn, function(req, res, next) {
  result = [];
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query("SELECT * FROM teachers ORDER BY last_name", (err, rows) => {
      if (err) {
        return next(err);
      }
      rows.forEach(row => {
          result.push({ id: row.id, firstname: row.first_name, lastname: row.last_name, secondname: row.second_name, code: row.approval_code });
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
        res.render("listTeacher", {
          title: "Список преподавателей", res: result,login: login,
		    lastname: lastname,
		    firstname: firstname,
		    secondname: secondname,
		    type_user: type_user,
		    email: email
        });
    });
    db.release();
    if (err) return next(err);
  });
});

router.get("/teacher/:id", isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query("SELECT * FROM teachers WHERE id=?", req.params.id, (err, rows) => {
      if (err) {
        return next(err);
      }
      var login,lastname,secondname,firstname,type_user,email = "";
      if (req.user){
		login = req.user.login;
		lastname = req.user.last_name;
		firstname = req.user.first_name;
		type_user = req.user.user_type;
		email = req.user.email;
		secondname = req.user.second_name;
	  }
      res.render("teacher", {
        title: "Преподаватель",
        val: rows[0],login: login,
		    lastname: lastname,
		    firstname: firstname,
		    secondname: secondname,
		    type_user: type_user,
		    email: email
      });
    });
    db.release();
    if (err) return next(err);
    // Don't use the db here, it has been returned to the pool.
  });
});

router.post("/teacher/:id", isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query(
      `UPDATE teachers SET last_name='${req.body.lastname}', first_name='${req.body.firstname
      }', second_name='${req.body.secondname}',approval_code='${req.body.code}' WHERE id=?;`,
      req.params.id,(err, rows) => {
        if (err) {
          return next(err);
        }
        res.redirect("/listTeacher");
      }
    );
    db.release();
    if (err) return next(err);
    // Don't use the db here, it has been returned to the pool.
  });
});

router.get("/delTeacher/:id", isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query("SELECT * FROM teachers WHERE id=?", req.params.id, (err, rows) => {
      if (err) {
        return next(err);
      }
      var login,lastname,secondname,firstname,type_user,email = "";
      if (req.user){
		login = req.user.login;
		lastname = req.user.last_name;
		firstname = req.user.first_name;
		type_user = req.user.user_type;
		email = req.user.email;
		secondname = req.user.second_name;
	  }
      res.render("delTeacher", {
        title: "Удалить преподавателя",
        val: rows[0],login: login,
		    lastname: lastname,
		    firstname: firstname,
		    secondname: secondname,
		    type_user: type_user,
		    email: email
      });
    });
    db.release();
    if (err) return next(err);
    // Don't use the db here, it has been returned to the pool.
  });
});

router.post("/delTeacher/:id", isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query(`DELETE FROM teachers WHERE id=?;`, req.params.id, (err, rows) => {
      if (err) {
        return next(err);
      }
    });
    db.release();
    if (err) return next(err);
    // Don't use the db here, it has been returned to the pool.
  });
  res.redirect("/listTeacher");
});

router.get("/listSubject",isLoggedIn, function(req, res, next) {
    result = [];
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query("SELECT * FROM subjects ORDER BY name", (err, rows) => {
            if (err) {
                return next(err);
            }
            rows.forEach(row => {
                result.push({ id: row.id, name: row.name });
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
            res.render("listSubject", {
                title: "Список предметов", res: result,login: login,
                lastname: lastname,
                firstname: firstname,
                secondname: secondname,
                type_user: type_user,
                email: email
            });
        });
        db.release();
        if (err) return next(err);
    });
});


router.post("/addSubject", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query(
            `INSERT INTO subjects(name) VALUES ('${req.body.name}');`,
            err => {
                if (err) {
                    return next(err);
                }
                res.redirect("/listSubject");
            }
        );
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

router.get("/subject/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query("SELECT * FROM subjects WHERE id=?", req.params.id, (err, rows) => {
            if (err) {
                return next(err);
            }
            var login,lastname,secondname,firstname,type_user,email = "";
            if (req.user){
                login = req.user.login;
                lastname = req.user.last_name;
                firstname = req.user.first_name;
                type_user = req.user.user_type;
                email = req.user.email;
                secondname = req.user.second_name;
            }
            res.render("subject", {
                title: "Предмет",
                val: rows[0],login: login,
                lastname: lastname,
                firstname: firstname,
                secondname: secondname,
                type_user: type_user,
                email: email
            });
        });
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

router.post("/subject/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query(
            `UPDATE subjects SET name='${req.body.name}' WHERE id=?;`,
            req.params.id,(err, rows) => {
                if (err) {
                    return next(err);
                }
                res.redirect("/listSubject");
            }
        );
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

router.get("/delSubject/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query("SELECT * FROM subjects WHERE id=?", req.params.id, (err, rows) => {
            if (err) {
                return next(err);
            }
            var login,lastname,secondname,firstname,type_user,email = "";
            if (req.user){
                login = req.user.login;
                lastname = req.user.last_name;
                firstname = req.user.first_name;
                type_user = req.user.user_type;
                email = req.user.email;
                secondname = req.user.second_name;
            }
            res.render("delSubject", {
                title: "Удалить преподавателя",
                val: rows[0],login: login,
                lastname: lastname,
                firstname: firstname,
                secondname: secondname,
                type_user: type_user,
                email: email
            });
        });
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

router.post("/delSubject/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query(`DELETE FROM subjects WHERE id=?;`, req.params.id, (err, rows) => {
            if (err) {
                return next(err);
            }
        });
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
    res.redirect("/listSubject");
});


router.get("/listStudent",isLoggedIn, function(req, res, next) {
    var result = [];
    var studyGroups = [];
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("SELECT students.*, students.id as idstudent,DATE_FORMAT(birthYear, \"%d-%m-%Y\") as year,studygroups.* FROM students,studygroups WHERE studygroups.id = id_group ORDER BY last_name", (err, rows) => {
            if (err) {
                return next(err);
            }
            rows.forEach(row => {
                result.push({ id: row.idstudent, firstname: row.first_name, lastname: row.last_name, secondname: row.second_name, idgroup: row.id_group, birthyear: row.year, group: row.name });
            });
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
                res.render("listStudent", {
                    title: "Список студентов", res: result,studyGroups: studyGroups,login: login,
                    lastname: lastname,
                    firstname: firstname,
                    secondname: secondname,
                    type_user: type_user,
                    email: email
                });
            });
        });
        db.release();
        if (err) return next(err);
    });
});

router.get("/student/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        var studyGroups = [];
        var result = [];
        db.query("SELECT students.*,DATE_FORMAT(birthYear, \"%d-%m-%Y\") as year FROM students", (err, rows) => {
            if (err) {
                return next(err);
            }
            rows.forEach(row => {
                result.push({ id: row.id, firstname: row.first_name, lastname: row.last_name,secondname: row.second_name, birthyear: row.year  });
            });
            console.log(req.params.id)
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
                res.render("student", {
                    title: "Студент",studyGroups: studyGroups,
                    val: result[0],login: login,
                    lastname: lastname,
                    firstname: firstname,
                    secondname: secondname,
                    type_user: type_user,
                    email: email
                });
            });
        });
        db.release();
        if (err) return next(err);
    });
});

router.post("/student/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("SELECT id FROM studyGroups WHERE name=?",[req.body.studyGroup], function (err,row) {
            if (err) {
                console.log(err);
            }
            var idGroup = row[0].id;
            console.log(idGroup)
            console.log(req.params.id)
            if (idGroup != 0)
            {
                db.query(
                    `UPDATE students SET last_name='${req.body.lastname}', first_name='${req.body.firstname
                        }', second_name='${req.body.secondname}',birthyear='${req.body.birthyear2}',id_group='${idGroup}' WHERE id=?;`,
                    req.params.id,(err, rows) => {
                        if (err) {
                            return next(err);
                        }
                        res.redirect("/listStudent");
                    }
                );
            }
    });
        db.release();
        if (err) return next(err);
    });
});

router.get("/delStudent/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query("SELECT * FROM subjects WHERE id=?", req.params.id, (err, rows) => {
            if (err) {
                return next(err);
            }
            var login,lastname,secondname,firstname,type_user,email = "";
            if (req.user){
                login = req.user.login;
                lastname = req.user.last_name;
                firstname = req.user.first_name;
                type_user = req.user.user_type;
                email = req.user.email;
                secondname = req.user.second_name;
            }
            res.render("delSubject", {
                title: "Удалить преподавателя",
                val: rows[0],login: login,
                lastname: lastname,
                firstname: firstname,
                secondname: secondname,
                type_user: type_user,
                email: email
            });
        });
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

router.post("/delStudent/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query(`DELETE FROM subjects WHERE id=?;`, req.params.id, (err, rows) => {
            if (err) {
                return next(err);
            }
        });
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
    res.redirect("/listStudent");
});

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
        var studyGroups = []; var sqlgroups; var idTeacher;
        if (req.user){
            login = req.user.login;
            lastname = req.user.last_name;
            firstname = req.user.first_name;
            type_user = req.user.user_type;
            email = req.user.email;
            secondname = req.user.second_name;
        }
        if (type_user==="Преподаватель") {
            sqlgroups ="SELECT id,name FROM studyGroups WHERE id IN (SELECT id_group FROM subjteacher WHERE id_teacher=(SELECT id FROM teachers WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?))))";
            db.query("SELECT id FROM teachers WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?))",[login], (err, rows) => {
                if (err) return next(err);
                idTeacher = rows[0].id;
            });
        }
        if (type_user==="Куратор") {
            idTeacher = 0;
            sqlgroups = "SELECT id,name FROM studygroups WHERE id IN (SELECT id_group FROM groupcurator WHERE id_curator=(SELECT id FROM curators WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?))))";
        }
        if (type_user==="Студент") {
            idTeacher = 0;
            sqlgroups = "SELECT id,name FROM studygroups WHERE id=(SELECT id_group FROM students WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?)))";
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
                idTeacher: idTeacher
            });
        });
        db.release();
        if (err) return next(err);
    });
});

router.post("/reportsLists", function(req, res, next) {
    var subjectsList = [];
    var studentsList = [];
    var idSubjTeacher = req.body.idSubjTeacher;
    var code = req.body.code;
    var idSubject;
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query("SELECT attendance FROM studentattendance WHERE id_subjteacher IN (SELECT id FROM subjteacher WHERE id_group=1 AND id_student=1) AND date_attendance BETWEEN '2019-05-13' AND '2019-05-18';", (err, rows) => {
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

router.post("/getReport", function(req, res, next) {
    var result;
    var idSubjTeacher = req.body.idSubjTeacher;
    var code = req.body.code;
    var idSubject;
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query("SELECT attendance FROM studentattendance WHERE id_subjteacher IN (SELECT id FROM subjteacher WHERE id_group=1 AND id_student=1) AND date_attendance BETWEEN '2019-05-13' AND '2019-05-18';", (err, rows) => {
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


module.exports = router;
