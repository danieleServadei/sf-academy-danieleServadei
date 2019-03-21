// ExpressJS
const express = require("express");
const app = express();
// AWS SDK
const AWS = require("aws-sdk");
// RDS, Mysql
const rds = new AWS.RDS();
const mysql = require("mysql");
// Bcrypt, hash password
const bcrypt = require('bcrypt');
// Config and credentials
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
// Salt and Rounds for Bcrypt hashing
const salt = config.salt;
const rounds = config.rounds;
// Body parser and Express session
const bodyParser = require("body-parser")
const session = require("express-session");
// Functions
const { logged, randomString } = require("./functions");
const port = 80;

// Connect to RDS DB
const connection = mysql.createConnection({
  host: config.mysqlHost,
  user: config.mysqlUser,
  password: config.mysqlPassword,
  database: config.mysqlDB
});
connection.connect();

// Load AWS credentials
AWS.config.loadFromPath("./config.json");

// Express Middleware
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json())
app.use(express.static('pages'));
app.use(session({
  secret: "just a secret",
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}))

/*

/index
/autologin # test purposes
/login # login page
/register # register page
/dashboard # ICO dashboard

*/

// testing purposes
app.get("/autologin", (req, res) => {
  req.session.userId = 1;
  req.session.email = "daniele@gmail.com";
  req.session.username = "daniele";
  req.session.wallet = "EjOTgKyKzGt2DrkK9FjxeOsk3x32X9EEKEEZE8jTtxVwiYXC4i7NFoMKhsdIqLz4";
  res.redirect("/dashboard");
});

app.get("/index", (req, res) => {
  res.redirect("/");
});

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: `${__dirname}/pages`});
});

app.get("/dashboard", (req, res) => {
  logged(req).then(() => {
    res.sendFile("dashboard.html", { root: `${__dirname}/pages`});
  }).catch(() => {
    res.redirect("/login");
  })
});

app.get("/login", (req, res) => {
  res.sendFile("login.html", { root: `${__dirname}/pages`});
});

app.get("/register", (req, res) => {
  res.sendFile("account-register.html", { root: `${__dirname}/pages`});
});

/*

API
/api/login # login
/api/register # register, wallet creation etc.

*/

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Check if the email is valid
  if (!email) {
    res.status(200).json({
      code: 400,
      message: "Invalid Email"
    });
    process.exit();
  }

  // Check if the user exists
  connection.query('SELECT * FROM users WHERE email = ?', [email], (error, results, fields) => {
    if (results[0]) {
      const hash = results[0].password;
      // Compare the two passwords
      bcrypt.compare(`${password}${salt}`, hash, (err, compared) => {
        if (compared) {
          req.session.userId = results[0].id;
          req.session.email = results[0].email;
          req.session.username = results[0].username;
          req.session.wallet = results[0].wallet;
          res.status(200).json({
            code: 200,
            message: "Logged in successfully!"
          });
        } else {
          res.status(200).json({
            code: 400,
            message: "Invalid Password"
          });
        }
      });
    } else {
      res.status(200).json({
        code: 400,
        message: "Invalid Email"
      });
    }
  });
});

app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  const wallet = randomString(64);

  if (!email) {
    res.status(200).json({
      code: 400,
      message: "Invalid Email"
    });
    process.exit();
  }

  // Check if the user already exists
  connection.query('SELECT * FROM users WHERE email = ?', [email], (error, results, fields) => {
    if (error) throw error;
    if (results[0]) {
      res.status(200).json({
        code: 400,
        message: "An account with this email already exist."
      });
    } else {
      // Insert the user in the DB
      bcrypt.hash(`${password}${salt}`, rounds, (err, hash) => {
        connection.query('INSERT INTO users (username, email, password, wallet) VALUES (?, ?, ?, ?);', [username, email, hash, wallet], (error, results, fields) => {
          if (error) throw error;
          res.status(200).json({
            code: 200,
            message: "User Created"
          });
        });
      });
    }
  });
});

// catch 404 error
app.get("*", (req, res) => {
  res.status(404).send("not found");
});

// listen
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});