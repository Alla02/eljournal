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

module.exports = router;