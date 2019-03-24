const mysql = require("mysql");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const connection = mysql.createConnection({
  host: config.mysqlHost,
  user: config.mysqlUser,
  password: config.mysqlPassword,
  database: config.mysqlDB
});
connection.connect();

const logged = (req) => {
  return new Promise((resolve, reject) => {
    !req.session.userId ? reject() : resolve()
  });
}

const getTransactions = (userId) => {
  connection.query('SELECT * FROM transactions WHERE sender_id = ?', [userId], (error, results, fields) => {
    return results;
  });
}

const getUser = (userId) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM users WHERE id = ?', [userId], (error, results, fields) => {
      resolve(results[0]);
    });
  });
}

const randomString = (length) => {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

module.exports = { 
  logged: logged,
  randomString: randomString,
  getTransactions: getTransactions,
  getUser: getUser
}