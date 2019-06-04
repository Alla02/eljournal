(function (pp) {

    var passport        = require('passport'),
        LocalStrategy   = require('passport-local').Strategy,
        bcrypt          = require('bcryptjs'),
        config          = require('./config'),
        mysql           = require('mysql'),
        db              = mysql.createConnection(config.dbconnection);
    //init passport functions

    pp.init = function (app) {

        passport.serializeUser(function (user, done) {
            done(null, user.login);
        }); //end serialize

        passport.deserializeUser(function (login, done) {
                var sql = "select * from users where login='" + login + "'";
                var sql2;
                db.query(sql, function (err, row, next) {
                    if (err) {
                        console.log(err);
                        return next(err);
                    }
                    var user = {};
                    user.id = row[0].id;
                    user.login = row[0].login;
                    user.user_type = row[0].typeUser;
                    user.email = row[0].email;
                    var sql2 = "select * from persons where id_user='" + row[0].id + "'";
                    db.query(sql2, function (err, row) {
                        user.first_name = row[0].first_name;
                        user.last_name = row[0].last_name;
                        user.second_name = row[0].second_name;
                        done(err, user);
                    });
                });
        }); //end deserialize

        //register new user strategy
        passport.use('local-signup', new LocalStrategy({
                usernameField : 'login',
                passwordField : 'password',
                passReqToCallback : true
            },

            function (req, login, password,done) {
                var sql = "select * from users where login=?";
                var sql2 = "select * from users where email=?";
				try{
					db.query(sql, [login], function (err, row) {
						if (err) {
							return done(err);
						}
						if (row.length) { //then there is a user here already
                            console.log("login");
							return done(null, false, req.flash('registerMessage', 'Пользователь с данным логином уже существует'));
						}
						else {
							db.query(sql2, [req.body.email], function (err, row) {
								if (err) {
									return done(err);
								}
								if (row.length) { //then there is email here already
                                    console.log("email");
									return done(null, false, req.flash('registerMessage', 'Пользователь с данным email уже существует'));
								}
								else {
									var user = {};
									user.login = login;
									if (req.body.password == req.body.password2) {
										bcrypt.hash(password, 5, function (err, hash) { //hash the password and save to the mysql database
											if (err) {
												return next(err);
											}
                                            var stgroup = [];
                                            stgroup =  req.body.studyGroup;
                                            user.password = hash;
                                            user.login = req.body.login;
                                            user.user_type = req.body.user_type;
                                            user.first_name = req.body.first_name;
                                            user.second_name = req.body.second_name;
                                            user.last_name = req.body.last_name;
                                            user.birthyear = req.body.birthyear;
                                            //user.studyGroup = req.body.studyGroup;
                                            var canView;
                                            if (req.body.canView === "1") canView = 1;
                                            else canView=0;

                                            db.query("INSERT into users (login,password,typeUser,email) values (?,?,?,?);",[user.login,user.password,user.user_type,req.body.email], function (err) {
                                                if (err) {
                                                    console.log(err);
                                                }
                                                else {
                                                    db.query("SELECT id FROM users ORDER BY id DESC LIMIT 1;", function (err, row) {
                                                        console.log("Last inserted id is: " + row[0].id);
                                                        if (err) {
                                                            console.log(err);
                                                        }
                                                        else{
                                                            var idUser = row[0].id;
                                                            db.query("INSERT into persons (first_name,last_name,second_name,id_user,birthYear) values (?,?,?,?,?);",[user.first_name,user.last_name,user.second_name,idUser,req.body.birthyear], function (err) {
                                                                if (err) {
                                                                    console.log(err);
                                                                }
                                                                else {
                                                                    db.query("SELECT id FROM persons ORDER BY id DESC LIMIT 1;", function (err, row) {
                                                                        console.log("Last inserted personsid is: " + row[0].id);
                                                                        if (err) {
                                                                            console.log(err);
                                                                        }
                                                                        else{
                                                                            var idPerson = row[0].id;
                                                                            var rand = 1000 - 0.5 + Math.random() * (9999 - 1000 + 1)
                                                                            rand = Math.round(rand);
                                                                            if (req.body.user_type==='Преподаватель') {
                                                                                db.query("INSERT into teachers (approval_code, id_person) values (?,?);",[rand,idPerson], function (err) {
                                                                                    if (err) {
                                                                                        console.log(err);
                                                                                    }
                                                                                    console.log("inserted into teacher")
                                                                                })
                                                                            }
                                                                            else {
                                                                                if (req.body.user_type==='Студент') {
                                                                                    db.query("INSERT into students (id_person, canView, id_group) VALUES ('"+idPerson+"',"+canView+",(SELECT id from studyGroups where name='"+[req.body.studyGroup]+"'));", function (err) {
                                                                                        if (err) {
                                                                                            console.log(err);
                                                                                        }
                                                                                        console.log("inserted into student")
                                                                                    })
                                                                                }
                                                                                else {
                                                                                    if (req.body.user_type==='Родитель') {
                                                                                        db.query("INSERT into parents (id_person) values (?);",[idPerson], function (err) {
                                                                                            if (err) {
                                                                                                console.log(err);
                                                                                            }
                                                                                            console.log("inserted into parent")
                                                                                            var studentsId = [];
                                                                                            studentsId = req.body.student;
                                                                                            console.log("studentsid " + studentsId);
                                                                                            console.log("studentsidlength " + studentsId.length);
                                                                                            if( typeof studentsId === 'string' ) {//если выбран один элемент, переводи его из строки в массив
                                                                                                studentsId = [ studentsId ];
                                                                                            }
                                                                                            console.log("studentsidlength " + studentsId.length);
                                                                                            if (studentsId.length != 0) {
                                                                                                db.query("SELECT id FROM parents ORDER BY id DESC LIMIT 1;", function (err, row) {
                                                                                                    var idParent = row[0].id;
                                                                                                    console.log("idParent "+idParent);
                                                                                                    if (idParent != 0){
                                                                                                        studentsId.forEach(row => {
                                                                                                            console.log("stgroupforeach "+row);
                                                                                                            db.query("INSERT into parentstudent (id_parent,id_student) values ('"+idParent+"',?);", [row],function (err, row) {
                                                                                                                if (err) {
                                                                                                                    console.log(err);
                                                                                                                }
                                                                                                                console.log("inserted into parentstudent");
                                                                                                            })
                                                                                                        });
                                                                                                    }
                                                                                                })
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                    else {
                                                                                        if (req.body.user_type==='Куратор') {
                                                                                            db.query("INSERT into curators (id_person) values (?);",[idPerson], function (err) {
                                                                                                if (err) {
                                                                                                    console.log(err);
                                                                                                }
                                                                                                console.log("inserted into curator")
                                                                                                console.log("lenghtreqgroup " + stgroup.length);
                                                                                                console.log("reqbodygroup: " + req.body.studyGroup);
                                                                                                if( typeof stgroup === 'string' ) {//если выбран один элемент, переводи его из строки в массив
                                                                                                    stgroup = [ stgroup ];
                                                                                                }
                                                                                                console.log("lenghtreqgroup " + stgroup.length);
                                                                                                if (stgroup.length != 0) {
                                                                                                    db.query("SELECT id FROM curators ORDER BY id DESC LIMIT 1;", function (err, row) {
                                                                                                        var idCurator = row[0].id;
                                                                                                        console.log("idCurator "+idCurator);
                                                                                                        if (idCurator != 0){
                                                                                                            stgroup.forEach(row => {
                                                                                                                console.log("stgroupforeach "+row);
                                                                                                                db.query("INSERT into groupcurator (id_curator,id_group) values ('"+idCurator+"',(SELECT id from studyGroups WHERE name=?));", [row],function (err, row) {
                                                                                                                    if (err) {
                                                                                                                        console.log(err);
                                                                                                                    }
                                                                                                                    console.log("inserted into groupcurator");
                                                                                                                })
                                                                                                            });
                                                                                                        }
                                                                                                    })
                                                                                                }
                                                                                                })
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                            done(err, req.user);
										})//end hash										
									}//end check passwords
									else {
										console.log('Пароли не совпадают');
										return done(null, false, req.flash('registerMessage', 'Пароли не совпадают'));
									}//end third else 
								}//end second else
							})//end second query
						}//end first else
					})//end first query
				}//end try
				catch(err){
                    console.log(err);
                }
		}));//end passport use signup

        //login strategy
        passport.use('local-login', new LocalStrategy({
                usernameField : 'login',
                passwordField : 'password',
                passReqToCallback : true // allows us to pass back the entire request to the callback
            },

            function (req, login, password, done) {
                db.query("SELECT * FROM users WHERE login=? or email=?", [login,login] , function (err, row) {
                    if (err) return done(err);
                    if (!row.length) return done(null, false, req.flash('loginMessage', 'Неверно введенный логин/email'));
                    var user = {};
                    user.login = row[0].login;
                    user.user_type = row[0].typeUser;
                    user.email = row[0].email;
                    var sql2 = "select * from persons where id_user='" + row[0].id + "'";
                    db.query(sql2, function (err, row) {
                        user.first_name = row[0].first_name;
                        user.last_name = row[0].last_name;
                        user.second_name = row[0].second_name;
                    });
                    bcrypt.compare(password, row[0].password, function (err, res) {
                        if (res) return done(null, user);
                        else return done(null, false, req.flash('loginMessage', 'Неверно введенный логин и/или пароль'));
                    }); //end compare
                });//end db.get
            })); //end local-login

        app.use(passport.initialize());
        app.use(passport.session());
    }; //end init
})(module.exports);