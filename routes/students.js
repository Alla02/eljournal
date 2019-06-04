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
            res.render("delStudent", {title: "Удалить студента",
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

module.exports = router;