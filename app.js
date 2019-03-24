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
const { logged, randomString, getTransactions } = require("./functions");
const port = 80;
// Solidity Smart Contract
const contract = require(`${__dirname}/solidity/contract`);

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

// EJS
app.set('view engine', 'ejs');
app.set('views', `${__dirname}/pages`);

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
/*app.use(["/dashboard", "/buy-ico", "/wallet", "/transactions", "/faq", "/profile"], (req, res, next) => {
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
})*/

/*

/index
/autologin # test purposes
/login # login page
/register # register page
/dashboard # ICO dashboard

*/

// testing purposes
app.use("*", (req, res, next) => {
  req.session.userId = 1;
  req.session.email = "daniele@gmail.com";
  req.session.username = "daniele";
  req.session.wallet = "pVPxsSM2qilsizBrEIU2tWYwx8v3njIhsK";
  req.session.register_date = "03/24/2019";
  next();
});

app.get("/users", (req, res) => {
  connection.query('SELECT * FROM users', (error, results, fields) => {
    res.json(results)
  });
});

app.get("/index", (req, res) => {
  res.redirect("/");
});

app.get("/", (req, res) => {
  res.sendFile("index.html", dir);
});

app.get("/dashboard", (req, res) => {
  const { userId, wallet } = req.session;
  
  res.render('dashboard.ejs', {
    userId: userId,
    wallet: wallet
  });
});

app.get("/buy-ico", (req, res) => {
  const { userId, wallet } = req.session;

  res.render('buy-ico.ejs', {
    userId: userId,
    wallet: wallet
  });
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
  const { userId, email, username, register_date, wallet } = req.session;

  // get transactions count
  let transactions = getTransactions(userId, connection);
  if (transactions) {
    transactions = Object.keys(transactions).length;
  } else {
    transactions = 0;
  }

  res.render('profile.ejs', {
    userId: userId,
    email: email,
    username: username,
    register_date: register_date,
    transactions_count: transactions,
    wallet: wallet
  });
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
/api/balance/:wallet # get wallet balance
/api/updateProfile # update profile, change username and password

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
          req.session.register_date = results[0].register_date;
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
  const wallet = randomString(34);

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
      let today = new Date();
      date = today.toLocaleDateString("it-IT");

      bcrypt.hash(`${password}${salt}`, rounds, (err, hash) => {
        connection.query('INSERT INTO users (username, email, password, wallet, register_date) VALUES (?, ?, ?, ?, ?);', [username, email, hash, wallet, date], (error, results, fields) => {
          if (error) throw error;
          contract.createWallet(wallet).then(() => {
            res.status(200).json({
              code: 200,
              message: "User Created"
            });
          });
        });
      });
    }
  });
});

app.post("/api/updateProfile", (req, res) => {
  const { username, newPassword, oldPassword } = req.body;
  const email = req.session.email;

  if (!username) {
    res.status(200).json({
      code: 400,
      message: "Invalid Username"
    });
    process.exit();
  }

  // check if the old password is correct
  connection.query('SELECT * FROM users WHERE email = ?', [email], (error, results, fields) => {
    if (results[0]) {
      const hash = results[0].password;
      bcrypt.compare(`${oldPassword}${salt}`, hash, (err, compared) => {
        if (compared) {
          let toHash = newPassword;
          if (!newPassword) {
            toHash = oldPassword;
          }
          bcrypt.hash(`${toHash}${salt}`, rounds, (err, hash) => {
            connection.query('UPDATE users SET username = ?, password = ? WHERE email = ?;', [username, hash, email], (error, results, fields) => {
              if (error) throw error;
              res.status(200).json({
                code: 200,
                message: "Your profile has been updated successfully!"
              });
            });
          });
        } else {
          res.status(200).json({
            code: 400,
            message: "Invalid Old Password"
          });
        }
      });
    } else {
      res.status(200).json({
        code: 400,
        message: "Something went wrong.."
      });
    }
  });

});

app.post("/api/transfer", (req, res) => {
  const { walletBuyer, walletSeller, price } = req.body;
  contract.transfer(walletBuyer, walletSeller, price).then(() => {
    res.status(200).json({
      code: 200,
      message: "tokens transferred successfully"
    });
  }).catch((e) => {
    res.status(200).json({
      code: 400,
      error: e
    })
  });
});

app.post("/api/addFounds", (req, res) => {
  const { wallet, tokens } = req.body;
  contract.addFounds(wallet, tokens).then(() => {
    res.status(200).json({
      code: 200,
      message: "tokens added successfully"
    });
  }).catch((e) => {
    res.status(200).json({
      code: 400,
      error: e
    })
  });
});

app.get("/api/balance/:wallet", (req, res) => {
  const wallet = req.params.wallet;
  contract.getWalletBalance(wallet).then((balance) => {
    res.status(200).json({
      code: 200,
      balance: balance
    });
  }).catch((e) => {
    res.status(200).json({
      code: 400,
      error: e
    })
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