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
router.get('/importSchedule', isLoggedIn, function(req, res, next) {
    var login,lastname,firstname,secondname,type_user,email = "";
    login = req.user.login;
    lastname = req.user.last_name;
    firstname = req.user.first_name;
    type_user = req.user.user_type;
    email = req.user.email;
    secondname = req.user.second_name;
    console.log(req.user)

    res.render("importSchedule", {
        title: "Импорт расписания",
        login: login,
        lastname: lastname,
        firstname: firstname,
        secondname: secondname,
        type_user: type_user,
        email: email
    });
});

/*
router.get("/getSubjects", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        //var jsonData;
        //let rawdata = fs.readFileSync('schedulejson.json');
        //var jsonData = JSON.parse(rawdata);

        let jsonData;
        async function getFile() {
            await http.get('http://185.43.4.44:3000/getSchedule', (resp) => {//подключение к сайту расписания и загрузка json файла
                let data = '';
                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    jsonData = JSON.parse(data);
                    jsonData.forEach(row => {
                        db.query("INSERT IGNORE INTO subjects (name) VALUES (?);",[row.subjectName], function(err, rows){
                            if (err) return next(err);
                        });
                    });
                });
            }).on("error", (err) => {
                console.log("Error: " + err.message);
            });
        }
        getFile()
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});

router.get("/getGroups", function(req, res, next) {
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        //var jsonData;
        //let rawdata = fs.readFileSync('schedulejson.json');
        //var jsonData = JSON.parse(rawdata);
        jsonData.forEach(row => {
            db.query("INSERT IGNORE INTO studyGroups (name) VALUES (?);",[row.groupName], function(err, rows){
                if (err) return next(err);
            });
        });
        db.release();
        if (err) return next(err);
        // Don't use the db here, it has been returned to the pool.
    });
});*/

function generateLogin() {//генерация случайного логина и email
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}
/*
router.get("/regAllTeachers", function(req, res, next) { //регистрация преподавателей из json файла
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        //var jsonData;
        //let rawdata = fs.readFileSync('schedulejson.json');
        //var jsonData = JSON.parse(rawdata);
        bcrypt.hash("123", 5, function (err, hash) {
            if (err) return next(err);
            async function checkIfExist(firstname, lastname, secondname) {
                return new Promise(function(res) {
                    db.query("SELECT * FROM persons where first_name=? AND last_name=? AND second_name=?;", [firstname, lastname, secondname], function (err, rows) {
                        //console.log("1 " + rows.length);
                        console.log("1 " + firstname+ lastname+ secondname);
                        if (err) return next(err);
                        if (rows.length == 0) res(0);
                        else res(1);
                    });
                })
            }

            async function insertIntoUsers(login, pass, typeUser, email) {
                return new Promise(function(res) {
                    db.query("INSERT into users (login,password,typeUser,email) values (?,?,?,?);", [login, pass, typeUser, email], function (err) {
                        console.log("2");
                        if (err) return next(err);
                        res();
                    });
                })
            }

            async function selectUserId() {
                return new Promise(function(res) {
                    db.query("SELECT id FROM users ORDER BY id DESC LIMIT 1;", function (err, row) {
                        if (err) return next(err);
                        console.log("Last inserted id is: " + row[0].id);
                        res(row[0].id);
                    });
                })
            }

            async function insertIntoPersons(firstname, lastname, secondname, idUser) {
                return new Promise(function(res) {
                    db.query("INSERT into persons (first_name,last_name,second_name,id_user) values (?,?,?,?);", [firstname, lastname, secondname, idUser], function (err) {
                        console.log("four");
                        if (err) return next(err);
                        res();
                    });
                })
            }

            async function selectPersonId() {
                return new Promise(function(res) {
                    db.query("SELECT id FROM persons ORDER BY id DESC LIMIT 1;", function (err, row) {
                        if (err) return next(err);
                        console.log("five");
                        res(row[0].id);
                    });
                })
            }

            async function insertIntoTeachers(idPerson) {
                return new Promise(function(res) {
                    var rand = 1000 - 0.5 + Math.random() * (9999 - 1000 + 1)
                    rand = Math.round(rand);
                    db.query("INSERT into teachers (approval_code, id_person) values (?,?);", [rand, idPerson], function (err) {
                        console.log("inserted into teacher")
                        if (err) console.log(err);
                        res();
                    })
                })
            }

            async function regAll() {
                for (var i = 0; i< jsonData.length; i++){
                    var typeUser = "Преподаватель";
                    var pass = hash;
                    var login = generateLogin();
                    var email = generateLogin();
                    //var i = 0;
                    console.log(jsonData[i].firstname, jsonData[i].lastname, jsonData[i].secondname);
                    var res;
                    res = await checkIfExist(jsonData[i].firstname, jsonData[i].lastname, jsonData[i].secondname);
                    //res.then(r=>checkIfExist(jsonData[i].firstname, jsonData[i].lastname, jsonData[i].secondname));
                    //console.log("res "+res);
                    if (res == 1) continue;
                    else {
                        await insertIntoUsers(login, pass, typeUser, email);
                        var userId = await selectUserId();
                        console.log(userId);
                        await insertIntoPersons(jsonData[i].firstname, jsonData[i].lastname, jsonData[i].secondname,userId);
                        var personId = await selectPersonId();
                        await insertIntoTeachers(personId);
                    }
                }
            }
            let jsonData;
            async function getFile() {
                await http.get('http://185.43.4.44:3000/getSchedule', (resp) => {//подключение к сайту расписания и загрузка json файла
                    let data = '';
                    // A chunk of data has been recieved.
                    resp.on('data', (chunk) => {
                        data += chunk;
                    });
                    // The whole response has been received. Print out the result.
                    resp.on('end', () => {
                        jsonData = JSON.parse(data);
                        regAll();
                        //console.log(jsonData2);
                    });
                }).on("error", (err) => {
                    console.log("Error: " + err.message);
                });
            }
            getFile()
        });
        db.release();
        if (err) return next(err);
    });
});
*/
router.post("/getSchedule", function(req, res, next) { //импорт расписания
    pool.getConnection(function(err, db) {
        if (err) return next(err); // not connected!
        let hash;
        //var jsonData;
        //let rawdata2 = fs.readFileSync('file.json');
        //var jsonData = JSON.parse(rawdata);
        //console.log(jsonData);
        function getGroups() {//заполняем группы
            console.log("getGroups");
            jsonData.forEach(row => {
                db.query("INSERT IGNORE INTO studyGroups (name) VALUES (?);",[row.groupName], function(err, rows){//ignore - т.к. имя должно быть уникальное
                    if (err) return next(err);
                });
            });
        }

        function getSubjects() {//заполняем предметы
            console.log("getSubjects");
            jsonData.forEach(row => {
                db.query("INSERT IGNORE INTO subjects (name) VALUES (?);",[row.subjectName], function(err, rows){
                    if (err) return next(err);
                });
            });
        }
        bcrypt.hash("123", 5, function (err, hash2) {
            hash = hash2;
        });
        function checkIfExist(firstname, lastname, secondname) {
            return new Promise(function(res) {
                db.query("SELECT * FROM persons where first_name=? AND last_name=? AND second_name=?;", [firstname, lastname, secondname], function (err, rows) {
                    //console.log("1 " + rows.length);
                    //console.log("1 " + firstname+ lastname+ secondname);
                    if (err) return next(err);
                    if (rows.length === 0) res(0);
                    else res(1);
                });
            })
        }

        function insertIntoUsers(login, pass, typeUser, email) {
            return new Promise(function(res) {
                db.query("INSERT into users (login,password,typeUser,email) values (?,?,?,?);", [login, pass, typeUser, email], function (err) {
                    //console.log("2");
                    if (err) return next(err);
                    res();
                });
            })
        }

        function selectUserId() {
            return new Promise(function(res) {
                db.query("SELECT id FROM users ORDER BY id DESC LIMIT 1;", function (err, row) {
                    if (err) return next(err);
                    //console.log("Last inserted id is: " + row[0].id);
                    res(row[0].id);
                });
            })
        }

        function insertIntoPersons(firstname, lastname, secondname, idUser) {
            return new Promise(function(res) {
                db.query("INSERT into persons (first_name,last_name,second_name,id_user) values (?,?,?,?);", [firstname, lastname, secondname, idUser], function (err) {
                    //console.log("four");
                    if (err) return next(err);
                    res();
                });
            })
        }

        function selectPersonId() {
            return new Promise(function(res) {
                db.query("SELECT id FROM persons ORDER BY id DESC LIMIT 1;", function (err, row) {
                    if (err) return next(err);
                    //console.log("five");
                    res(row[0].id);
                });
            })
        }

        function insertIntoTeachers(idPerson) {
            return new Promise(function(res) {
                var rand = 1000 - 0.5 + Math.random() * (9999 - 1000 + 1)
                rand = Math.round(rand);
                db.query("INSERT into teachers (approval_code, id_person) values (?,?);", [rand, idPerson], function (err) {
                    //console.log("inserted into teacher")
                    if (err) console.log(err);
                    res();
                })
            })
        }

        async function regAll() {//регистрация преподавателей
            console.log("regAll");
            for (var i = 0; i< jsonData.length; i++){
                var typeUser = "Преподаватель";
                var pass = hash;
                var login = generateLogin();
                var email = generateLogin();
                //var i = 0;
                //console.log(jsonData[i].firstname, jsonData[i].lastname, jsonData[i].secondname);
                var res;
                res = await checkIfExist(jsonData[i].firstname, jsonData[i].lastname, jsonData[i].secondname);
                //res.then(r=>checkIfExist(jsonData[i].firstname, jsonData[i].lastname, jsonData[i].secondname));
                //console.log("res "+res);
                if (res == 1) continue;
                else {
                    await insertIntoUsers(login, pass, typeUser, email);
                    var userId = await selectUserId();
                    //console.log(userId);
                    await insertIntoPersons(jsonData[i].firstname, jsonData[i].lastname, jsonData[i].secondname,userId);
                    var personId = await selectPersonId();
                    await insertIntoTeachers(personId);
                }
            }
        }

        function selectIdTeacher(firstname, lastname, secondname) {
            return new Promise(function(res) {
                db.query("SELECT teachers.id as tid FROM persons INNER JOIN teachers ON persons.id = teachers.id_person WHERE first_name=? AND last_name=? AND second_name=?;",[firstname,lastname,secondname], function (err, row) {
                    //console.log("1 ");
                    //console.log(row);
                    if (err) return next(err);
                    if (row.length == 0) return res(-1);
                    else return res(row[0].tid);
                    //if (row[0].tid.==0) return res(-1)
                    //else return res(row[0].tid)
                    //res(row[0].tid);
                });
            })
        }

        function selectIdSubject(name) {
            return new Promise(function(res) {
                db.query("SELECT id FROM subjects WHERE name=?;",[name], function (err, row) {
                    //console.log("2");
                    if (err) return next(err);
                    if (row.length == 0) return res(-1);
                    else return res(row[0].id);
                });
            })
        }

        function selectIdGroup(groupName) {
            return new Promise(function(res) {
                db.query(`SELECT id FROM studygroups WHERE name=?;`,[groupName], function (err, row) {
                    if (err) return next(err);
                    if (row.length == 0) return res(-1);
                    else return res(row[0].id);
                });
            })
        }

        function selectIdSemester(beginDatePairs) {
            return new Promise(function(res) {
                db.query("SELECT id FROM semester WHERE start <= ? AND end >= ?;", [beginDatePairs, beginDatePairs], function (err, row) {
                    //console.log("four");
                    if (err) return next(err);
                    res(row[0].id);
                });
            })
        }

        function insertSubjTeacher(idSubject,idTeacher,typeSubject,idSemester,idGroup) {
            return new Promise(function(res) {
                db.query(`INSERT INTO subjteacher(id_subject, id_teacher, type_subject, id_semester, id_group) VALUES (?,?,?,?,?);`,[idSubject,idTeacher,typeSubject,idSemester,idGroup], err => {
                    //console.log("inserted into subjteacher")
                    if (err) console.log(err);
                    res();
                })
            })
        }

        function selectidSubjTeacher() {
            return new Promise(function(res) {
                db.query("SELECT id FROM subjteacher ORDER BY id DESC LIMIT 1;", function (err, row) {
                    if (err) return next(err);
                    //console.log("five");
                    res(row[0].id);
                });
            })
        }

        function insertSchedule(weekday, time, typeWeek, idSubjTeacher) {
            return new Promise(function(res) {
                db.query("INSERT into schedule (dayOfWeek,numPair,typeWeek,id_subjteacher) values (?,?,?,?);", [weekday, time, typeWeek, idSubjTeacher], function (err) {
                    //console.log("inserted into schedule")
                    if (err) console.log(err);
                    res();
                })
            })
        }

        async function getAll() {//импорт самого расписания
            console.log("getAll");
            for (var i = 0; i< jsonData.length; i++){
                //var i = 12;
                var idTeacher, idGroup, idSemester, typeWeek;
                var idSubject;
                //console.log(idTeacher, idSubject);
                await Promise.all([selectIdTeacher(jsonData[i].firstname, jsonData[i].lastname, jsonData[i].secondname),
                    selectIdSubject(jsonData[i].subjectName),selectIdGroup(jsonData[i].groupName),selectIdSemester(jsonData[i].beginDatePairs)]).then(results => {
                    idTeacher = results[0];
                    idSubject = results[1];
                    idGroup = results[2];
                    idSemester =results[3];
                });
                if (idTeacher == -1 || idSubject == -1 || idGroup == -1) continue;
                //console.log(idTeacher,idSubject,idGroup,idSemester);
                await insertSubjTeacher(idSubject,idTeacher,jsonData[i].typeSubjectName,idSemester,idGroup);
                var idSubjTeacher = await selectidSubjTeacher();
                var w = jsonData[i].week;
                if (w.length === 0) typeWeek = "Обе";
                if (w === "верхняя") typeWeek = "Верхняя";
                if (w === "нижняя") typeWeek = "Нижняя";
                insertSchedule(jsonData[i].weekdayId, jsonData[i].timeId, typeWeek, idSubjTeacher);
            }
        }

        let jsonData;
        async function getFile() {
            await http.get('http://185.43.4.44:3000/getSchedule', (resp) => {//подключение к сайту расписания и загрузка json файла
                let data = '';
                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                // The whole response has been received. Print out the result.
                resp.on('end', async () => {
                    jsonData = JSON.parse(data);
                    await getGroups();
                    console.log("before getSubjects");
                    await getSubjects();
                    console.log("before getAllTeachers");
                    await regAll();
                    console.log("before getAll");
                    await getAll();
                    res.redirect("/");
                });
            }).on("error", (err) => {
                console.log("Error: " + err.message);
            });
        }
        getFile();
        db.release();
        if (err) return next(err);
    });
});

module.exports = router;