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

router.get("/listStudents",isLoggedIn, function(req, res, next) {
    var result = [];
    var studyGroups = [];
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        var login, lastname, secondname, firstname, type_user, email = "";
        if (req.user) {
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
                //db.query("SELECT students.id as idstudent, persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, DATE_FORMAT(persons.birthYear, \"%d-%m-%Y\") as year, studygroups.name " +
                   // "FROM persons " +
                   // "INNER JOIN students ON persons.id = students.id_person " +
                   // "INNER JOIN studygroups ON students.id_group=studygroups.id " +
                   // "ORDER BY persons.last_name", (err, rows) => {
                    db.query("SELECT students.id as idStudent,DATE_FORMAT(persons.birthYear, \"%d-%m-%Y\") as year,persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, studygroups.name," +
                        "table2.first_name as pfn, table2.last_name as pln,table2.second_name as psn "+
                        "FROM persons "+
                        "INNER JOIN students ON persons.id = students.id_person "+
                        "INNER JOIN studygroups ON students.id_group=studygroups.id "+
                        "LEFT JOIN parentstudent ON parentstudent.id_student = students.id "+
                        "LEFT JOIN parents ON parentstudent.id_parent = parents.id "+
                        "LEFT JOIN persons as table2 ON table2.id = parents.id_person "+
                        "ORDER BY persons.last_name", (err, rows) => {
                    if (err) return next(err);
                    rows.forEach(row => {
                        result.push({
                            id: row.idStudent,
                            firstname: row.firstname,
                            lastname: row.lastname,
                            secondname: row.secondname,
                            birthyear: row.year,
                            group: row.name,
                            pfn: row.pfn,
                            pln: row.pln,
                            psn: row.psn
                        });
                    });
                    res.render("listStudents", {
                        title: "Список студентов", res: result, studyGroups: studyGroups, login: login,
                        lastname: lastname,
                        firstname: firstname,
                        secondname: secondname,
                        type_user: type_user,
                        email: email
                    });
                });
            }
            else res.redirect("/");
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
        var login, lastname, secondname, firstname, type_user, email = "";
        if (req.user) {
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
                //db.query("SELECT students.id,persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, DATE_FORMAT(persons.birthYear, \"%d-%m-%Y\") as year, studygroups.name " +
                  //  "FROM persons " +
                  //  "INNER JOIN students ON persons.id = students.id_person " +
                   // "INNER JOIN studygroups ON students.id_group=studygroups.id " +
                   // "WHERE students.id =?", req.params.id, (err, rows) => {
                    db.query("SELECT students.id as idStudent,DATE_FORMAT(persons.birthYear, \"%d-%m-%Y\") as year,persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, studygroups.name," +
                        "table2.first_name as pfn, table2.last_name as pln,table2.second_name as psn "+
                        "FROM persons "+
                        "INNER JOIN students ON persons.id = students.id_person "+
                        "INNER JOIN studygroups ON students.id_group=studygroups.id "+
                        "LEFT JOIN parentstudent ON parentstudent.id_student = students.id "+
                        "LEFT JOIN parents ON parentstudent.id_parent = parents.id "+
                        "LEFT JOIN persons as table2 ON table2.id = parents.id_person "+
                        "WHERE students.id=? ORDER BY persons.last_name",req.params.id, (err, rows) => {
                    if (err) return next(err);
                    rows.forEach(row => {
                        result.push({
                            id: row.idStudent,
                            firstname: row.firstname,
                            lastname: row.lastname,
                            secondname: row.secondname,
                            birthyear: row.year,
                            group: row.name,
                            pfn: row.pfn,
                            pln: row.pln,
                            psn: row.psn
                        });
                    });
                    db.query("SELECT * FROM studyGroups ORDER BY name", (err, rows) => {
                        if (err) return next(err);
                        rows.forEach(row => {
                            studyGroups.push({id: row.id, name: row.name});
                        });
                        db.query("SELECT persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, parents.id " +
                            "FROM persons " +
                            "INNER JOIN parents ON persons.id = parents.id_person " +
                            "ORDER BY persons.last_name", (err, rows) => {
                            if (err) return next(err);
                            var parents=[];
                            rows.forEach(row => {
                                parents.push({id: row.id, pfn: row.firstname,pln: row.lastname,psn: row.secondname});
                            });
                            res.render("student", {
                                title: "Студент", studyGroups: studyGroups,parents:parents,
                                val: result[0], login: login,
                                lastname: lastname,
                                firstname: firstname,
                                secondname: secondname,
                                type_user: type_user,
                                email: email
                            });
                        });
                    });
                });
            }
            else res.redirect("/");
        });
        db.release();
        if (err) return next(err);
    });
});

router.post("/student/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        console.log(req.body.parent);
        if (req.body.parent ===""){console.log("1");
            db.query("UPDATE persons,students SET persons.first_name=?,persons.second_name=?,persons.last_name=?,students.id_group=?,persons.birthYear=? \n" +
                "WHERE persons.id=students.id_person AND students.id=?;",[req.body.firstname,req.body.secondname,req.body.lastname,req.body.studyGroup,req.body.birthyearstud,req.params.id], function (err) {
                if (err) return next(err);
                res.redirect("/listStudents");
            });
        }
        else {console.log("2");
            db.query("SELECT id FROM parentstudent WHERE id_student=?;",[req.params.id], function (err,rows) {
                if (err) return next(err);
                if (rows.length != 0){
                    db.query("UPDATE persons,students,parentstudent SET persons.first_name=?,persons.second_name=?,persons.last_name=?,students.id_group=?,persons.birthYear=?, " +
                        "parentstudent.id_parent=? "+
                        "WHERE persons.id=students.id_person AND students.id=? AND parentstudent.id_student=?;",[req.body.firstname,req.body.secondname,req.body.lastname,req.body.studyGroup,req.body.birthyearstud,req.body.parent,req.params.id,req.params.id], function (err) {
                        if (err) return next(err);
                        res.redirect("/listStudents");
                    });
                }
                else {
                    db.query("INSERT into parentstudent (id_parent, id_student) values (?,?);",[req.body.parent,req.params.id], function (err) {
                        if (err) return next(err);
                        db.query("UPDATE persons,students SET persons.first_name=?,persons.second_name=?,persons.last_name=?,students.id_group=?,persons.birthYear=? \n" +
                            "WHERE persons.id=students.id_person AND students.id=?;",[req.body.firstname,req.body.secondname,req.body.lastname,req.body.studyGroup,req.body.birthyearstud,req.params.id], function (err) {
                            if (err) return next(err);
                            res.redirect("/listStudents");
                        });
                    });
                }
            });
        }
        db.release();
        if (err) return next(err);
    });
});

router.get("/delStudent/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var result=[];
        var login, lastname, secondname, firstname, type_user, email = "";
        if (req.user) {
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
                db.query("SELECT students.id,persons.last_name as lastname, persons.first_name as firstname, persons.second_name as secondname, DATE_FORMAT(persons.birthYear, \"%d-%m-%Y\") as year, studygroups.name " +
                    "FROM persons " +
                    "INNER JOIN students ON persons.id = students.id_person " +
                    "INNER JOIN studygroups ON students.id_group=studygroups.id " +
                    "WHERE students.id =?", req.params.id, (err, rows) => {
                    if (err) {
                        return next(err);
                    }
                    rows.forEach(row => {
                        result.push({
                            id: row.id,
                            firstname: row.firstname,
                            lastname: row.lastname,
                            secondname: row.secondname,
                            birthyear: row.year,
                            group: row.name
                        });
                    });
                    res.render("delStudent", {
                        title: "Удалить студента",
                        val: result[0], login: login,
                        lastname: lastname,
                        firstname: firstname,
                        secondname: secondname,
                        type_user: type_user,
                        email: email
                    });
                });
            }
            else res.redirect("/");
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

module.exports = router;