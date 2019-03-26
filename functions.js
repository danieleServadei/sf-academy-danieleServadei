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

const getShopOrdersValue = (userId) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM shop WHERE userId = ?', [userId], (error, results, fields) => {
      let value = 0;
      let r = 0;
      for (r in results) {
        value += results[r].tokens;
      }
      resolve(value);
    });
  });
}

const getTransactions = (userId) => {
  let total = [];
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM shop WHERE userId = ? AND status != "available" ORDER BY id DESC LIMIT 3', [userId], (error, resultsShop, fields) => {
      connection.query('SELECT * FROM shop WHERE buyerId = ? ORDER BY id DESC LIMIT 3', [userId], (error, resultsBuyer, fields) => {
        for(let key in resultsShop) total.push(resultsShop[key]);
        for(let key in resultsBuyer) total.push(resultsBuyer[key]);
        resolve(total);
      });
    });
  });
}

const getUser = (userId) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM users WHERE id = ?', [userId], (error, results, fields) => {
      resolve(results[0]);
    });
  });
}

const getOrder = (id) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM shop WHERE id = ?', [id], (error, results, fields) => {
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
  getShopOrdersValue: getShopOrdersValue,
  getTransactions: getTransactions,
  getOrder: getOrder,
  getUser: getUser
}