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

module.exports = router;