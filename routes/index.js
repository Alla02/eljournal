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
      //db.query("SELECT column_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'typeUser';", (err, rows) => {
      db.query("SELECT * FROM type_user", (err, rows) => {
        if (err) {
          return next(err);
        }
        rows.forEach(row => {
          result.push({ id: row.id, name: row.name });
        });
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
		  res.render("register", {title: "Регистрация",list: result,login: login,
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
    console.log(req.body.studyGroup)
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

router.get('/attendance/:id', function(req, res, next) {
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
        db.query("SELECT * FROM weekdays", (err, rows) => {
            if (err) return next(err);
            var weekday = [];
            rows.forEach(row => {
                weekday.push({ id: row.id, name: row.name });
            });
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
                    if (listStudents.length===0) res.render("attendance", {title: "Посещаемость группы",weekday: weekday,times: times,listStudents:listStudents,login: login,
                        lastname: lastname,firstname: firstname,secondname: secondname,type_user: type_user,email: email,
                        message: req.flash("У этой группы нет студентов") });
                    else {
                        db.query("SELECT * FROM schedule WHERE id_subjteacher IN (SELECT id FROM subjteacher WHERE id_group=?)",req.params.id, (err, rows) => {
                            if (err) return next(err);
                            if (rows) res.render("attendance", {title: "Посещаемость группы",weekday: weekday,
                                times: times,listStudents: listStudents,login: login,
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
                                    });*/
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
                                                    res.render("attendance", {title: "Посещаемость группы",
                                                        weekday: weekday,
                                                        times: times,
                                                        subjects: subjects,
                                                        teachers: teachers,
                                                        typesubject: typesubject,
                                                        typeweek: typeweek,
                                                        semester: semester,
                                                        listStudents: listStudents,
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

router.post("/fillAttendance", function(req, res, next) {
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
    WHERE id_group=? and id_semester=? and dayOfWeek=? ORDER BY dayOfWeek, numPair`;
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
                db.query(str, [req.body.id_group, idSemester, req.body.day], (err, rows) => {
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
                                teacherName:
                                    row.lastname +
                                    " " +
                                    row.firstname +
                                    " " +
                                    row.secondname,
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
                db.query("SELECT id_subject FROM subjteacher WHERE id=?;", [idSubjTeacher], (err, rows) => {
                    if (err) return next(err);
                    idSubject=rows[0].id_subject;
                    res.send({result: result, idSubject: idSubject});
                });
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
        for (var i = 0; i< result.length; i++) {
            db.query("INSERT INTO studentattendance(id_student, id_subjteacher, date_attendance, attendance) VALUES (?,?,?,?);", [result[i].idStudent, result[i].idSubject, result[i].date, result[i].attendance], (err, rows) => {
                if (err) return next(err);
            });
        }
        res.sendStatus(200);
        db.release();
        if (err) return next(err);
    });
});


module.exports = router;
