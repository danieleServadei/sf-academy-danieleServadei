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

// pages root directory
const dir = {
  root: `${__dirname}/pages`
};

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

// Authentication needed middleware
app.use(["/dashboard", "/buy-ico", "/wallet", "/transactions", "/faq", "/profile"], (req, res, next) => {
  logged(req).then(() => {
    next();
  }).catch(() => {
    res.redirect("/login");
  })
})

// Login and Register redirect to dashboard
app.use(["/login", "/register"], (req, res, next) => {
  logged(req).then(() => {
    res.redirect("/dashboard");
  }).catch(() => {
    next();
  })
})

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
  res.sendFile("index.html", dir);
});

app.get("/dashboard", (req, res) => {
  res.sendFile("dashboard.html", dir);
});

app.get("/buy-ico", (req, res) => {
  res.sendFile("buy-ico.html", dir);
});

app.get("/wallet", (req, res) => {
  res.sendFile("wallet.html", dir);
});

app.get("/transactions", (req, res) => {
  res.sendFile("transactions.html", dir);
});

app.get("/faq", (req, res) => {
  res.sendFile("faq.html", dir);
});

app.get("/profile", (req, res) => {
  res.sendFile("profile.html", dir);
});

app.get("/login", (req, res) => {
  res.sendFile("login.html", dir);
});

app.get("/register", (req, res) => {
  res.sendFile("register.html", dir);
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
  res.sendFile("404.html", dir);
});

// listen
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});