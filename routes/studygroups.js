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

router.get("/listGroups",isLoggedIn, function(req, res, next) {
    var result = [];
    var curators=[];
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
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
                //db.query("SELECT id, name, YEAR(year_admission) as year_admission FROM studyGroups ORDER BY name", (err, rows) => {
                db.query("SELECT studygroups.id, studygroups.name, persons.last_name as lastname,persons.first_name as firstname,persons.second_name as secondname " +
                    "FROM studygroups " +
                    "LEFT JOIN groupcurator ON studygroups.id=groupcurator.id_group " +
                    "LEFT JOIN curators ON groupcurator.id_curator=curators.id " +
                    "LEFT JOIN persons ON persons.id=curators.id_person " +
                    "ORDER BY studygroups.name", (err, rows) => {
                    if (err)return next(err);
                    rows.forEach(row => {
                        result.push({id: row.id, name: row.name, lastname: row.lastname, firstname:row.firstname,secondname:row.secondname});
                    });
                    db.query("SELECT curators.id,persons.last_name as lastname,persons.first_name as firstname,persons.second_name as secondname " +
                        "FROM persons " +
                        "INNER JOIN curators ON persons.id=curators.id_person " +
                        "ORDER BY persons.last_name", (err, rows) => {
                        if (err)return next(err);
                        rows.forEach(row => {
                            curators.push({id: row.id, lastname: row.lastname, firstname:row.firstname,secondname:row.secondname});
                        });
                        res.render("listGroups", {
                            title: "Список групп",
                            studyGroup: result, curators:curators, login: login,
                            lastname: lastname,
                            firstname: firstname,
                            secondname: secondname,
                            type_user: type_user,
                            email: email
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

router.post("/addGroup", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        /*db.query(`INSERT INTO studyGroups(name,year_admission) VALUES ('${req.body.nameGroup}', '${req.body.yearAdmission}');`,err => {
                if (err) return next(err);
                res.redirect("/listGroups");
            }
        );*/

        function insertIntoGroups(groupName) {
            return new Promise(function(res) {
                db.query("INSERT into studygroups (name) values (?);", [groupName], function (err) {
                    if (err) console.log(err);
                    res();
                })
            })
        }

        function lastInserted() {
            return new Promise(function(res) {
                db.query("SELECT id FROM studyGroups ORDER BY id DESC LIMIT 1;", function (err,rows) {
                    if (err) console.log(err);
                    res(rows[0].id);
                })
            })
        }

        async function addGroup() {
                var result;
                await insertIntoGroups(req.body.nameGroup);
                result = await lastInserted();
                console.log(result,req.body.curator);
                db.query("INSERT into groupcurator (id_group,id_curator) values (?,?);", [result,req.body.curator], function (err) {
                    if (err) console.log(err);
                    res.redirect("/listGroups");
                });
        }
        addGroup();
        db.release();
        if (err) return next(err);
    });
});

router.get("/studygroup/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        var login, lastname, secondname, firstname, type_user, email = "";
        if (req.user) {
            login = req.user.login;
            lastname = req.user.last_name;
            firstname = req.user.first_name;
            type_user = req.user.user_type;
            email = req.user.email;
            secondname = req.user.second_name;
        }
        var curators=[];
        var group=[];
        db.query("SELECT isAdmin FROM curators WHERE id_person=(SELECT id FROM persons WHERE id_user=(SELECT id FROM users WHERE login=?))",[login], (err, rows) => {
            if (err) return next(err);
            if (rows.length != 0 && rows[0].isAdmin===1 ) {
                db.query("SELECT studygroups.id, studygroups.name, curators.id as curId " +
                    "FROM studygroups " +
                    "LEFT JOIN groupcurator ON groupcurator.id_group=studygroups.id " +
                    "LEFT JOIN curators ON groupcurator.id_curator=curators.id " +
                    "WHERE studygroups.id=?", req.params.id, (err, rows) => {
                    if (err) return next(err);
                    group.push({id: rows[0].id, name: rows[0].name, curId: rows[0].curId});
                    console.log(group)
                    db.query("SELECT curators.id,persons.last_name as lastname,persons.first_name as firstname,persons.second_name as secondname " +
                        "FROM persons " +
                        "INNER JOIN curators ON persons.id=curators.id_person " +
                        "ORDER BY persons.last_name", (err, rows) => {
                        if (err)return next(err);
                        rows.forEach(row => {
                            curators.push({id: row.id, lastname: row.lastname, firstname:row.firstname,secondname:row.secondname});
                        });
                        res.render("studyGroup", {
                            title: "Группа",
                            val: group[0],curators:curators, login: login,
                            lastname: lastname,
                            firstname: firstname,
                            secondname: secondname,
                            type_user: type_user,
                            email: email
                        });
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
        db.query("SELECT id FROM groupcurator WHERE id_group=?;",[req.params.id], function (err,rows) {
            if (err) return next(err);
            if (rows.length != 0){
                db.query("UPDATE groupcurator SET id_curator WHERE id_group=?;",[req.body.curator,req.params.id], function (err) {
                    if (err) return next(err);
                    db.query("UPDATE studygroups SET name WHERE id=?;",[req.body.name,req.params.id], function (err) {
                        if (err) return next(err);
                        res.redirect("/listStudents");
                    });
                });
            }
            else {
                db.query("INSERT into groupcurator (id_curator, id_group) values (?,?);",[req.body.curator,req.params.id], function (err) {
                    if (err) return next(err);
                    db.query("UPDATE studygroups SET name WHERE id=?;",[req.body.name,req.params.id], function (err) {
                        if (err) return next(err);
                        res.redirect("/listStudents");
                    });
                });
            }
        });
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

router.get("/delGroup/:id", isLoggedIn, function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
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
                db.query("SELECT * FROM studygroups WHERE id=?", req.params.id, (err, rows) => {
                    if (err) {
                        return next(err);
                    }
                    res.render("delGroup", {
                        title: "Удалить группу",
                        val: rows[0], login: login,
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


module.exports = router;