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


router.get("/listGroups",isLoggedIn, function(req, res, next) {
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
        res.render("listGroups", {
          studyGroup: result,login: login,
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
        res.redirect("/listGroups");
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
        res.redirect("/listGroups");
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
  res.redirect("/listGroups");
});

router.get("/listTeachers",isLoggedIn, function(req, res, next) {
  var result = [];
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
    db.query("SELECT persons.second_name as secondname, persons.last_name as lastname, persons.first_name as firstname, teachers.approval_code as code, teachers.id as tId FROM teachers " +
        "INNER JOIN persons ON teachers.id_person=persons.id ORDER BY persons.last_name", (err, rows) => {
      if (err) {
        return next(err);
      }
      rows.forEach(row => {
          result.push({ id: row.tId, firstname: row.firstname, lastname: row.lastname, secondname: row.secondname, code: row.code });
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
        res.render("listTeachers", {result: result,login: login,
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
    db.query("SELECT persons.second_name as secondname, persons.last_name as lastname, persons.first_name as firstname, teachers.approval_code as code, teachers.id as id FROM teachers " +
        "INNER JOIN persons ON teachers.id_person=persons.id WHERE teachers.id=?", req.params.id, (err, rows) => {
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
    if (err) return next(err);
    console.log(req.body);
      db.query("UPDATE persons,teachers SET persons.first_name=?,persons.second_name=?,persons.last_name=?,teachers.approval_code=? " +
          "WHERE persons.id=teachers.id_person AND teachers.id=?;",
          [req.body.firstname,req.body.secondname,req.body.lastname,req.body.code,req.params.id], (err) => {
        if (err) return next(err);
        res.redirect("/listTeachers");
      });
    db.release();
    if (err) return next(err);
  });
});

router.get("/delTeacher/:id", isLoggedIn, function(req, res, next) {
  pool.getConnection(function(err, db) {
    if (err) return next(err); // not connected!
      db.query("SELECT persons.second_name as secondname, persons.last_name as lastname, persons.first_name as firstname, teachers.approval_code as code, teachers.id as id FROM teachers " +
          "INNER JOIN persons ON teachers.id_person=persons.id WHERE teachers.id=?", req.params.id, (err, rows) => {
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
      res.render("delTeacher", {
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
  res.redirect("/listTeachers");
});

router.get("/listSubjects",isLoggedIn, function(req, res, next) {
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
            res.render("listSubjects", {res: result,login: login,
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
                res.redirect("/listSubjects");
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
        db.query(`UPDATE subjects SET name='${req.body.name}' WHERE id=?;`,
            req.params.id,(err, rows) => {
                if (err) return next(err);
                res.redirect("/listSubjects");
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
            res.render("delSubject", {
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
            if (err) return next(err);
        });
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
    res.redirect("/listSubject");
});


router.get("/listStudents",isLoggedIn, function(req, res, next) {
    var result = [];
    var studyGroups = [];
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("SELECT students.id as idstudent, persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, DATE_FORMAT(persons.birthYear, \"%d-%m-%Y\") as year, studygroups.name " +
            "FROM persons " +
            "INNER JOIN students ON persons.id = students.id_person " +
            "INNER JOIN studygroups ON students.id_group=studygroups.id " +
            "ORDER BY persons.last_name", (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({ id: row.idstudent, firstname: row.firstname, lastname: row.lastname, secondname: row.secondname, birthyear: row.year, group: row.name });
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
            res.render("listStudents", {
                title: "Список студентов", res: result,studyGroups: studyGroups,login: login,
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

router.get("/student/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        var studyGroups = [];
        var result = [];
        db.query("SELECT students.id,persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, DATE_FORMAT(persons.birthYear, \"%d-%m-%Y\") as year, studygroups.name " +
            "FROM persons " +
            "INNER JOIN students ON persons.id = students.id_person " +
            "INNER JOIN studygroups ON students.id_group=studygroups.id " +
            "WHERE students.id =?",req.params.id, (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({ id: row.id, firstname: row.firstname, lastname: row.lastname,secondname: row.secondname, birthyear: row.year  });
            });
            db.query("SELECT * FROM studyGroups ORDER BY name", (err, rows) => {
                if (err) return next(err);
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
        db.query("UPDATE persons,students SET persons.first_name=?,persons.second_name=?,persons.last_name=?,students.id_group=? \n" +
            "WHERE persons.id=students.id_person AND students.id=?;",[req.body.firstname,req.body.secondname,req.body.lastname,req.body.studyGroup,req.params.id], function (err,row) {
            if (err) return next(err);
            res.redirect("/listStudents");
    });
        db.release();
        if (err) return next(err);
    });
});

router.get("/delStudent/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var result=[];
        db.query("SELECT students.id,persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, DATE_FORMAT(persons.birthYear, \"%d-%m-%Y\") as year, studygroups.name " +
            "FROM persons " +
            "INNER JOIN students ON persons.id = students.id_person " +
            "INNER JOIN studygroups ON students.id_group=studygroups.id " +
            "WHERE students.id =?",req.params.id, (err, rows) => {
            if (err) {
                return next(err);
            }
            rows.forEach(row => {
                result.push({ id: row.id, firstname: row.firstname, lastname: row.lastname,secondname: row.secondname, birthyear: row.year, group: row.name  });
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
            res.render("delStudent", {
                val: result[0],login: login,
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
        if (err) return next(err);
        db.query("DELETE FROM users WHERE id=(SELECT id_user FROM persons WHERE id=(SELECT id_person FROM students WHERE id=?));", req.params.id, (err, rows) => {
            if (err) return next(err);
        });
        db.release();
        if (err) return next(err);
    });
    res.redirect("/listStudents");
});

router.get("/listCurators",isLoggedIn, function(req, res, next) {
    var result = [];
    var studyGroups = [];
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("SELECT persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, curators.id "+
        "FROM persons "+
        "INNER JOIN curators ON persons.id = curators.id_person "+
        "ORDER BY last_name", (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({ id: row.id, firstname: row.firstname, lastname: row.lastname, secondname: row.secondname});
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
            res.render("listCurators", {
                res: result,login: login,
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

router.get("/curator/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        var studyGroups = [];
        var result = [];
        db.query("SELECT persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, curators.id "+
            "FROM persons "+
            "INNER JOIN curators ON persons.id = curators.id_person "+
            "WHERE curators.id=?",req.params.id, (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({ id: row.id, firstname: row.firstname, lastname: row.lastname,secondname: row.secondname });
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
            res.render("curator", {
                val: result[0],login: login,
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

router.post("/curator/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("UPDATE persons,curators SET persons.first_name=?,persons.second_name=?,persons.last_name=? " +
            "WHERE persons.id=curators.id_person AND curators.id=?;",[req.body.firstname,req.body.secondname,req.body.lastname,req.params.id], function (err,row) {
            if (err) return next(err);
            res.redirect("/listCurators");
        });
        db.release();
        if (err) return next(err);
    });
});

router.get("/delCurator/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var result=[];
        db.query("SELECT persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, curators.id "+
            "FROM persons "+
            "INNER JOIN curators ON persons.id = curators.id_person "+
            "WHERE curators.id=?",req.params.id, (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({ id: row.id, firstname: row.firstname, lastname: row.lastname,secondname: row.secondname });
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
            res.render("delCurator", {
                val: result[0],login: login,
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

router.post("/delCurator/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("DELETE FROM curators WHERE id=?;", req.params.id, (err, rows) => {
            if (err) return next(err);
        });
        db.release();
        if (err) return next(err);
    });
    res.redirect("/listCurators");
});

router.get("/listParents",isLoggedIn, function(req, res, next) {
    var result = [];
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("SELECT persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, parents.id "+
            "FROM persons "+
            "INNER JOIN parents ON persons.id = parents.id_person "+
            "ORDER BY last_name", (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({ id: row.id, firstname: row.firstname, lastname: row.lastname, secondname: row.secondname});
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
            res.render("listParents", {
                res: result,login: login,
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

router.get("/parent/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        var result = [];
        db.query("SELECT persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, parents.id "+
            "FROM persons "+
            "INNER JOIN parents ON persons.id = parents.id_person "+
            "WHERE parents.id=?",req.params.id, (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({ id: row.id, firstname: row.firstname, lastname: row.lastname,secondname: row.secondname });
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
            res.render("parent", {
                val: result[0],login: login,
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

router.post("/parent/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("UPDATE persons,parents SET persons.first_name=?,persons.second_name=?,persons.last_name=? " +
            "WHERE persons.id=parents.id_person AND parents.id=?;",[req.body.firstname,req.body.secondname,req.body.lastname,req.params.id], function (err,row) {
            if (err) return next(err);
            res.redirect("/listParents");
        });
        db.release();
        if (err) return next(err);
    });
});

router.get("/delParent/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var result=[];
        db.query("SELECT persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, parents.id "+
            "FROM persons "+
            "INNER JOIN parents ON persons.id = parents.id_person "+
            "WHERE parents.id=?",req.params.id, (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({ id: row.id, firstname: row.firstname, lastname: row.lastname,secondname: row.secondname });
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
            res.render("delParent", {
                val: result[0],login: login,
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

router.post("/delParent/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("DELETE FROM parents WHERE id=?;", req.params.id, (err, rows) => {
            if (err) return next(err);
        });
        db.release();
        if (err) return next(err);
    });
    res.redirect("/listParents");
});

router.get("/listSemesters",isLoggedIn, function(req, res, next) {
    var result = [];
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("SELECT persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, parents.id "+
            "FROM persons "+
            "INNER JOIN parents ON persons.id = parents.id_person "+
            "ORDER BY last_name", (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({ id: row.id, firstname: row.firstname, lastname: row.lastname, secondname: row.secondname});
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
            res.render("listSemesters", {
                res: result,login: login,
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

router.get("/semester/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        var result = [];
        db.query("SELECT persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, parents.id "+
            "FROM persons "+
            "INNER JOIN parents ON persons.id = parents.id_person "+
            "WHERE parents.id=?",req.params.id, (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({ id: row.id, firstname: row.firstname, lastname: row.lastname,secondname: row.secondname });
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
            res.render("semester", {
                val: result[0],login: login,
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

router.post("/semester/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("UPDATE persons,parents SET persons.first_name=?,persons.second_name=?,persons.last_name=? " +
            "WHERE persons.id=parents.id_person AND parents.id=?;",[req.body.firstname,req.body.secondname,req.body.lastname,req.params.id], function (err,row) {
            if (err) return next(err);
            res.redirect("/listSemesters");
        });
        db.release();
        if (err) return next(err);
    });
});

router.get("/delSemester/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var result=[];
        db.query("SELECT persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, parents.id "+
            "FROM persons "+
            "INNER JOIN parents ON persons.id = parents.id_person "+
            "WHERE parents.id=?",req.params.id, (err, rows) => {
            if (err) return next(err);
            rows.forEach(row => {
                result.push({ id: row.id, firstname: row.firstname, lastname: row.lastname,secondname: row.secondname });
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
            res.render("delSemester", {
                val: result[0],login: login,
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

router.post("/delSemester/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("DELETE FROM parents WHERE id=?;", req.params.id, (err, rows) => {
            if (err) return next(err);
        });
        db.release();
        if (err) return next(err);
    });
    res.redirect("/listSemesters");
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
                    db.query("SELECT * FROM studentattendance WHERE id_subjteacher IN (SELECT id FROM subjteacher WHERE id_group=? AND id_student=?) AND date_attendance BETWEEN ? AND ?;",[req.body.idGroup,req.body.idStudent,req.body.beginDate,req.body.endDate], (err, rows) => {
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
                        db.query("SELECT * FROM studentattendance WHERE id_subjteacher IN (SELECT id FROM subjteacher WHERE id_group=? AND id_student=? AND id_subject=?) AND date_attendance BETWEEN ? AND ?;",[req.body.idGroup,req.body.idStudent,req.body.idSubject,req.body.beginDate,req.body.endDate], (err, rows) => {
                            if (err) return next(err);
                            console.log(rows);
                            console.log("4");
                            rows.forEach(row => {
                                result.push({ id: row.id, attendance: row.attendance, dateAtt: row.date_attendance});
                            });
                            res.send(JSON.stringify(result));
                        });
                    }
                }
            }
        }
        db.release();
        if (err) return next(err);
    });
});


module.exports = router;
