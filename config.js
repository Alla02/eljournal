var dbconnection = {
connectionLimit : 10,
host : 'localhost',
user : 'root',
password : '',
port : '3306',
database : 'eljournal'
   };

module.exports = {
    "applicationName": "eljournal",
    "sessionSecret": "blabla",
    "dbconnection": dbconnection,
    "sessionTimeout": 3600000
};  