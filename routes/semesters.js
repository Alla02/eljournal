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

router.get("/listSemesters",isLoggedIn, function(req, res, next) {
    var result = [];
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
                db.query("SELECT id, DATE_FORMAT(start, \"%d-%m-%Y\") as start,DATE_FORMAT(end, \"%d-%m-%Y\") as end,week, name FROM semester", (err, rows) => {
                    if (err) return next(err);
                    rows.forEach(row => {
                        result.push({id: row.id, start: row.start, end: row.end, name: row.name, week: row.week});
                    });
                    res.render("listSemesters", {
                        title: "Список семестров",
                        result: result, login: login,
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

router.get("/semester/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
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
                db.query("SELECT id, DATE_FORMAT(start, \"%d-%m-%Y\") as start,DATE_FORMAT(end, \"%d-%m-%Y\") as end,week, name FROM semester where id=?", req.params.id, (err, rows) => {
                    if (err) return next(err);
                    rows.forEach(row => {
                        result.push({id: row.id, start: row.start, end: row.end, name: row.name, week: row.week});
                    });
                    res.render("semester", {
                        title: "Семестр",
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
    });
});

router.post("/semester/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("UPDATE semester SET start=?,end=?,name=?,week=? " +
            "WHERE id=?;",[req.body.startsemester,req.body.endsemester,req.body.name,req.body.week,req.params.id], function (err,row) {
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
                db.query("SELECT id, DATE_FORMAT(start, \"%d-%m-%Y\") as start,DATE_FORMAT(end, \"%d-%m-%Y\") as end,week, name FROM semester where id=?", req.params.id, (err, rows) => {
                    if (err) return next(err);
                    rows.forEach(row => {
                        result.push({id: row.id, start: row.start, end: row.end, name: row.name, week: row.week});
                    });
                    res.render("delSemester", {
                        title: "Удалить семестр",
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
    });
});

router.post("/delSemester/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err);
        db.query("DELETE FROM semester WHERE id=?;", req.params.id, (err, rows) => {
            if (err) return next(err);
        });
        db.release();
        if (err) return next(err);
    });
    res.redirect("/listSemesters");
});

router.post("/addSemester", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        db.query(`INSERT INTO semester(start,end,name,week) VALUES ('${req.body.startsemester}', '${req.body.endsemester}','${req.body.name}','${req.body.week}');`,err => {
                if (err) return next(err);
                res.redirect("/listSemesters");
            }
        );
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

module.exports = router;