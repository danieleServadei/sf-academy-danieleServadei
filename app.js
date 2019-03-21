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
const { logged, randomString } = require("./functions");
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
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.get("/index", (req, res) => {
  logged(req).then(() => {
    res.sendFile("index.html", { root: `${__dirname}/pages`});
  }).catch(() => {
    res.redirect("/login");
  })
});

// testing purposes
app.get("/autologin", (req, res) => {
  req.session.userId = 1;
  req.session.email = "daniele@gmail.com";
  req.session.username = "daniele";
  req.session.wallet = "EjOTgKyKzGt2DrkK9FjxeOsk3x32X9EEKEEZE8jTtxVwiYXC4i7NFoMKhsdIqLz4";
  res.redirect("/index");
});

app.get("/login", (req, res) => {
  res.sendFile("login.html", { root: `${__dirname}/pages`});
});

app.get("/register", (req, res) => {
  res.sendFile("register.html", { root: `${__dirname}/pages`});
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  connection.query('SELECT * FROM users WHERE email = ?', [email], (error, results, fields) => {
    if (results[0]) {
      const hash = results[0].password;
      bcrypt.compare(`${password}${salt}`, hash, (err, compared) => {
        if (compared) {
          req.session.userId = results[0].id;
          req.session.email = results[0].email;
          req.session.username = results[0].username;
          req.session.wallet = results[0].wallet;
          res.status(200).send("user authenticated");
        } else {
          res.status(200).send("invalid password");
        }
      });
    } else {
      res.status(200).send("invalid email");
    }
  });
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});