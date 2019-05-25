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

module.exports = router;