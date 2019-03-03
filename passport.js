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
                    user.user_type = row[0].user_type;
                    user.email = row[0].email;
                        if (row[0].user_type=='Куратор') sql2 = "select * from curators where user_id='" + row[0].id + "'";
                        if (row[0].user_type=='Студент') sql2 = "select * from students where user_id='" + row[0].id + "'";
                        if (row[0].user_type=='Родитель') sql2 = "select * from parents where user_id='" + row[0].id + "'";
                        if (row[0].user_type=='Преподаватель') sql2 = "select * from teachers where user_id='" + row[0].id + "'";
                    db.query(sql2, function (err, row) {
                        user.first_name = row[0].first_name;
                        user.last_name = row[0].last_name;
                        user.second_name = row[0].second_name;
                        user.birthyear = row[0].birthyear;
                        done(err, user);
                    });
                });
        }); //end deserialize

        //register new user strategy
        /*
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
											user.password = hash;
                                            user.login = req.body.login;
                                            user.user_type = req.body.user_type;
                                            var sql3;
                                            var sql4;
                                            var sql5;
                                            var rand = 1000 - 0.5 + Math.random() * (9999 - 1000 + 1)
                                            rand = Math.round(rand);
                                            if (req.body.user_type=='Преподаватель') {sql3 = "INSERT into teacher (first_name, second_name, last_name, approval_code) values (?,?,?,?);";
                                            sql4 = "INSERT into users (login,password,user_type,email,id_teacher) values (?,?,?,?,?);";
                                            sql5 = "SELECT id FROM teacher ORDER BY id DESC LIMIT 1;";
                                                db.query(sql3,[req.body.first_name,req.body.second_name,req.body.last_name,rand], function (err) {
                                                    if (err) {
                                                        console.log(err);
                                                        }
                                                        console.log("insert into teacher")
                                                    })
                                            }
                                            else {
                                                if (req.body.user_type=='Студент') {sql3 = "INSERT into student (first_name, second_name, last_name, birthyear,id_group) values (?,?,?,?,?);";
                                                sql4 = "INSERT into users (login,password,user_type,email,id_student) values (?,?,?,?,?);";
                                                sql5 = "SELECT id FROM student ORDER BY id DESC LIMIT 1;";
                                                var secn = req.body.second_name;
                                                console.log("lastn "+secn)
                                                console.log("lastnlength "+secn.length)
                                                if (!secn) secn = null;
                                                console.log("lastn "+secn)
                                                    db.query("INSERT into student (first_name, second_name, last_name, BirthYear,id_group) SELECT "+[req.body.first_name]+","+secn+","+[req.body.last_name]+", '"+[req.body.birthyear]+"',"+"id from studyGroup where name=?;",[req.body.studyGroup], function (err) {
                                                    //db.query("INSERT into student (first_name, second_name, last_name, BirthYear,id_group) VALUES(?,?,?,?,SELECT studyGroup.id from studyGroup where studyGroup.name=?);",[req.body.first_name,secn,req.body.last_name,req.body.birthyear,req.body.studyGroup], function (err) {
                                                        if (err) {
                                                            console.log(err);
                                                        }
                                                        console.log("blabla")
                                                    })
                                                    //})
                                                    
                                                }
                                                else {
                                                    if (req.body.user_type=='Родитель') {sql3 = "INSERT into parent (first_name, second_name, last_name) values (?,?,?);";
                                                    sql4 = "INSERT into users (login,password,user_type,email,id_parent) values (?,?,?,?,?);";
                                                    sql5 = "SELECT id FROM parent ORDER BY id DESC LIMIT 1;";
                                                        db.query(sql3,[req.body.first_name,req.body.second_name,req.body.last_name], function (err) {
                                                            if (err) {
                                                                console.log(err);
                                                            }
                                                            console.log("insert into parent")
                                                        })
                                                    }
                                                    else {
                                                        if (req.body.user_type=='Куратор') {sql3 = "INSERT into curator (first_name, second_name, last_name) values (?,?,?);";
                                                        sql4 = "INSERT into users (login,password,user_type,email,id_curator) values (?,?,?,?,?);";
                                                        sql5 = "SELECT id FROM curator ORDER BY id DESC LIMIT 1;";
                                                            db.query(sql3,[req.body.first_name,req.body.second_name,req.body.last_name], function (err) {
                                                                if (err) {
                                                                    console.log(err);
                                                                }
                                                                console.log("insert into curator")
                                                            })
                                                        }
                                                    }
                                                }
                                            }
                                            user.first_name = req.body.first_name;
                                            user.second_name = req.body.second_name;
                                            user.last_name = req.body.last_name;
                                            user.user_type = req.body.user_type;
                                            user.birthyear = req.body.birthyear;
                                            user.studyGroup = req.body.studyGroup;
                                            console.log(user.birthyear);
                                            //db.query("SELECT LAST_INSERT_ID() as id", function (err,row) {
                                            db.query(sql5, function (err,row) {
                                                console.log("Last inserted id is: " + row[0].id);
                                                if (err) {
                                                    console.log(err);
                                                }
                                                console.log(row);
                                                var idUser = row[0].id;
                                                //if (user.user_type=='Студент') idUser= row[0].id+1;
                                                console.log("idUser "+idUser);
                                                db.query(sql4,[user.login,user.password,user.user_type,req.body.email,idUser], function (err) {
                                                    if (err) {
                                                        console.log(err);
                                                    }
                                                });
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
		*/

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
                                            user.password = hash;
                                            user.login = req.body.login;
                                            user.user_type = req.body.user_type;
                                            var sqlreg = "INSERT into users (login,password,user_type,email) values (?,?,?,?);";
                                            db.query(sqlreg,[user.login,user.password,user.user_type,req.body.email], function (err) {
                                                if (err) {
                                                    console.log(err);
                                                }
                                                sql5 = "SELECT id FROM users ORDER BY id DESC LIMIT 1;";
                                                db.query(sql5, function (err,row) {
                                                    if (err) {
                                                        console.log(err);
                                                    }
                                                    var idUser = row[0].id;
                                                    console.log("idUser "+idUser);
                                                    var sql3;
                                                    var rand = 1000 - 0.5 + Math.random() * (9999 - 1000 + 1)
                                                    rand = Math.round(rand);
                                                    if (req.body.user_type=='Преподаватель') {sql3 = "INSERT into teachers (first_name, second_name, last_name, approval_code, user_id) values (?,?,?,?,?);";
                                                        db.query(sql3,[req.body.first_name,req.body.second_name,req.body.last_name,rand,idUser], function (err) {
                                                            if (err) {
                                                                console.log(err);
                                                            }
                                                            console.log("insert into teacher")
                                                        })
                                                    }
                                                    else {
                                                        if (req.body.user_type=='Студент') {sql3 = "INSERT into students (first_name, second_name, last_name, birthyear,id_group, user_id) values (?,?,?,?,?);";
                                                            var secn = req.body.second_name;
                                                            console.log("lastn "+secn)
                                                            console.log("lastnlength "+secn.length)
                                                            if (!secn) secn = null;
                                                            console.log("lastn "+secn)
                                                            db.query("INSERT into students (first_name, second_name, last_name, BirthYear, user_id, id_group) VALUES ('"+[req.body.first_name]+"','"+secn+"','"+[req.body.last_name]+"', '"+[req.body.birthyear]+"','"+idUser+"',"+"(SELECT id from studyGroups where name='"+[req.body.studyGroup]+"'));", function (err) {
                                                                //db.query("INSERT into students (first_name, second_name, last_name, BirthYear, user_id, id_group) SELECT "+[req.body.first_name]+","+secn+","+[req.body.last_name]+", '"+[req.body.birthyear]+"',"+idUser+","+"id from studyGroups where name=?;",[req.body.studyGroup], function (err) {
                                                                //db.query("INSERT into student (first_name, second_name, last_name, BirthYear,id_group) VALUES(?,?,?,?,SELECT studyGroup.id from studyGroup where studyGroup.name=?);",[req.body.first_name,secn,req.body.last_name,req.body.birthyear,req.body.studyGroup], function (err) {
                                                                if (err) {
                                                                    console.log(err);
                                                                }
                                                                console.log("blabla")
                                                            })
                                                            //})

                                                        }
                                                        else {
                                                            if (req.body.user_type=='Родитель') {sql3 = "INSERT into parents (first_name, second_name, last_name, user_id) values (?,?,?,?);";
                                                                db.query(sql3,[req.body.first_name,req.body.second_name,req.body.last_name,idUser], function (err) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                    }
                                                                    console.log("insert into parent")
                                                                })
                                                            }
                                                            else {
                                                                if (req.body.user_type=='Куратор') {sql3 = "INSERT into curators (first_name, second_name, last_name, user_id) values (?,?,?,?);";
                                                                    db.query(sql3,[req.body.first_name,req.body.second_name,req.body.last_name,idUser], function (err) {
                                                                        if (err) {
                                                                            console.log(err);
                                                                        }
                                                                        console.log("insert into curator")
                                                                    })
                                                                }
                                                            }
                                                        }
                                                    }
                                                });
                                            });

                                            user.first_name = req.body.first_name;
                                            user.second_name = req.body.second_name;
                                            user.last_name = req.body.last_name;
                                            user.user_type = req.body.user_type;
                                            user.birthyear = req.body.birthyear;
                                            user.studyGroup = req.body.studyGroup;
                                            console.log(user.birthyear);
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
                        if (err) {
                            return done(err);
                        } //end err
                        console.log(login);
                        console.log(row);
                        if (err) {
                            return done(err);
                        } //end err
                        if (!row.length) {
                        return done(null, false, req.flash('loginMessage', 'Неверно введенный логин/email'));
                        }
                        var sql2;
                        var user = {};
                        user.login = row[0].login;
                        user.user_type = row[0].user_type;
                        user.email = row[0].email;
                        if (row[0].user_type=='Куратор') sql2 = "select * from curators where user_id='" + row[0].id + "'";
                        if (row[0].user_type=='Студент') sql2 = "select * from students where user_id='" + row[0].id + "'";
                        if (row[0].user_type=='Родитель') sql2 = "select * from parents where user_id='" + row[0].id + "'";
                        if (row[0].user_type=='Преподаватель') sql2 = "select * from teachers where user_id='" + row[0].id + "'";
                        db.query(sql2, function (err, row) {
                            user.first_name = row[0].first_name;
                            user.last_name = row[0].last_name;
                            user.second_name = row[0].second_name;
                        });
                        bcrypt.compare(password, row[0].password, function (err, res) {
                            console.log(row[0].password);
                            console.log(password);
                            console.log(res);
                            if (res) {
                                console.log("res");
                                return done(null, user);
                            } else {console.log("notres");
                                return done(null, false, req.flash('loginMessage', 'Неверно введенный логин и/или пароль'));
                            }
                        }); //end compare
                    });//end db.get
            })); //end local-login

        app.use(passport.initialize());
        app.use(passport.session());
    }; //end init
})(module.exports);