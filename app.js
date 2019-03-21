const express = require("express");
const app = express();
const AWS = require("aws-sdk");
const rds = new AWS.RDS();
const mysql = require("mysql");
const bcrypt = require('bcrypt');
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const salt = config.salt;
const rounds = config.rounds;
const bodyParser = require("body-parser")
const session = require("express-session");
const port = 8080;

const connection = mysql.createConnection({
  host: config.mysqlHost,
  user: config.mysqlUser,
  password: config.mysqlPassword,
  database: config.mysqlDB
});

connection.connect();

AWS.config.loadFromPath("./config.json");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json())
app.use(session({
  secret: "just a secret",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

app.get("/login", (req, res) => {
  res.sendFile("login.html", { root: `${__dirname}/pages`});
});

app.get("/register", (req, res) => {
  res.sendFile("register.html", { root: `${__dirname}/pages`});
});

app.post("/api/login", (req, res) => {
  res.status(200).json(req.body);
});

app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  const wallet = randomString(64);

  connection.query('SELECT * FROM users WHERE email = ?', [email], (error, results, fields) => {
    if (error) throw error;
    if (results[0]) {
      res.status(200).send("user already exist");
    } else {
      bcrypt.hash(`${password}${salt}`, rounds, (err, hash) => {
      connection.query('INSERT INTO users (username, email, password, wallet) VALUES (?, ?, ?, ?);', [username, email, hash, wallet], (error, results, fields) => {
        if (error) throw error;
        res.status(200).send("user created");
      });
    });
    }
  });
});

const randomString = (length) => {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});