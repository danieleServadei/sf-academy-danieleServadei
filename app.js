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
const { logged, randomString, getUser, getShopOrdersValue, getOrder, getTransactions } = require("./functions");
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

testing purposes



*/
app.use("*", (req, res, next) => {
  req.session.userId = 1;
  req.session.email = "daniele@gmail.com";
  req.session.username = "daniele";
  req.session.wallet = "pVPxsSM2qilsizBrEIU2tWYwx8v3njIhsK";
  req.session.register_date = "03/24/2019";
  next();
});
// Authentication needed middleware
app.use(["/dashboard", "/buy-ico", "/wallet", "/shop", "/faq", "/profile"], (req, res, next) => {
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

app.get("/users", (req, res) => {
  connection.query('SELECT * FROM users', (error, results, fields) => {
    res.json(results)
  });
});

app.get("/index", (req, res) => {
  res.redirect("/");
});

app.get("/", (req, res) => {
  res.sendFile('index.html', dir);
});

app.get("/dashboard", (req, res) => {
  res.sendFile('dashboard.html', dir);
});

app.get("/buy-ico", (req, res) => {
  res.sendFile('buy-ico.html', dir);
});

app.get("/wallet", (req, res) => {
  res.sendFile('wallet.html', dir);
});

app.get("/shop", (req, res) => {
  res.sendFile("shop.html", dir);
});

app.get("/faq", (req, res) => {
  res.sendFile("faq.html", dir);
});

app.get("/profile", (req, res) => {
  res.sendFile('profile.html', dir);
});

app.get("/login", (req, res) => {
  res.sendFile('login.html', dir);
});

app.get("/register", (req, res) => {
  res.sendFile('register.html', dir);
});

/*

API
/api/login # login
/api/user # get user infos
/api/register # register, wallet creation etc.
/api/balance/:wallet # get wallet balance
/api/updateProfile # update profile, change username and password
/api/addFounds # add tokens into wallet
/api/deposit # deposit ETH
/api/balance # get wallet balance
/api/ethereum/balance # get ethereum balance
/api/burn # burn tokens
/api/utils/set/:amount # set tokens available
/api/utils/investors/:investorsNamesArray # give investors 

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
          req.session.eth_balance = results[0].eth_balance;
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

app.get("/api/user", (req, res) => {
  const { userId } = req.session;
  getUser(userId).then((user) => {
    req.session.eth_balance = user.eth_balance;
    res.status(200).json({
      code: 200,
      user: user
    });
  }).catch((error) => {
    res.status(200).json({
      code: 400,
      error: error
    });
  });
})

app.get("/api/user/transactions", (req, res) => {
  const { userId } = req.session;
  getTransactions(userId).then((result) => {
    res.status(200).json({
      code: 200,
      transactions: result
    });
  });
})

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

app.post("/api/deposit", (req, res) => {
  let { amount } = req.body;
  const { userId } = req.session;
  amount = parseFloat(amount);

  getUser(userId).then((user) => {
    let newEthBalance = user.eth_balance + amount;
    req.session.eth_balance = newEthBalance;
    connection.query('UPDATE users SET eth_balance = ? WHERE id = ?;', [newEthBalance, userId], (error, results, fields) => {
      if (error) throw error;
      res.status(200).json({
        code: 200,
        message: `Deposit completed. You have now ${newEthBalance} ETH in your wallet.`
      });
    });
  });
});

app.post("/api/addFounds", (req, res) => {
  const { tokens } = req.body;
  const { wallet, userId } = req.session;
  const ETHprice = tokens*0.00042;

  // check that there still enough tokens for this transaction
  contract.getTokensAvailable((amount) => {
    if (amount < tokens) {
      res.status(200).json({
        code: 400,
        error: "Tokens available terminated. The contract has no more! Take a look at our Token Shop in order to buy more."
      });
      process.exit();
    }
  });

  getUser(userId).then((user) => {
    if (user.eth_balance < ETHprice) {
      res.status(200).json({
        code: 400,
        error: "You do not have enough ETH in your wallet, please deposit more ETH in order to complete this transaction."
      });
    } else {
      contract.addFounds(wallet, tokens).then(() => {
        let newEthBalance = user.eth_balance - ETHprice;
        req.session.eth_balance = newEthBalance;
        connection.query('UPDATE users SET eth_balance = ? WHERE id = ?;', [newEthBalance, userId], (error, results, fields) => {
          if (error) throw error;
          res.status(200).json({
            code: 200,
            message: "Transaction completed successfully, you may need to wait a few minutes in order to see your balance updated."
          });
        });
      }).catch((e) => {
        res.status(200).json({
          code: 400,
          error: e
        })
      });
    }
  });
});

app.post("/api/order", (req, res) => {
  const { amount, price } = req.body;
  const { userId, username, wallet } = req.session;

  const today = new Date();
  const date = today.toLocaleDateString("it-IT");

  if (!amount || !price || price <= 0 || amount <= 0) {
    res.status(200).json({
      code: 400,
      message: "Please fill both amount and price."
    })
  } else {
    getShopOrdersValue(userId).then((trValue) => {
      trValue += parseFloat(amount);
      contract.getWalletBalance(wallet).then((balance) => {
        if (balance < trValue) {
          res.status(200).json({
            code: 400,
            message: "You do not have enough Tokens!"
          })
        } else {
          connection.query('INSERT INTO shop (userId, username, price, tokens, date) VALUES (?, ?, ?, ?, ?);', [userId, username, price, amount, date], (error, results, fields) => {
            if (error) throw error;
            res.status(200).json({
              code: 200,
              message: "Order created!"
            })
          });
        }
      });
    });
  }
});

app.post("/api/transfer", (req, res) => {
  const { orderId, amount, price } = req.body;
  const { wallet, eth_balance, userId } = req.session;
  const eth_price = price*config.USDinETH;
  if (eth_balance < eth_price) {
    res.status(200).json({
      code: 400,
      message: "You do not have enough ETH deposited in your wallet to complete the transaction."
    })
  } else {
    getOrder(orderId).then((order) => {
      if (order.status == "available") {
        getUser(order.userId).then((seller) => {
          if (seller.id != userId) {
            contract.transfer(wallet, seller.wallet, amount).then(() => {

              new_eth_balance = eth_balance - eth_price;
              req.session.eth_balance = new_eth_balance;
              connection.query('UPDATE users SET eth_balance = ? WHERE id = ?', [new_eth_balance, userId]);
              connection.query('UPDATE shop SET status = "purchased", buyerId = ? WHERE id = ?', [userId, orderId]);

              seller_new_eth_balance = seller.eth_balance + eth_price;
              connection.query('UPDATE users SET eth_balance = ? WHERE id = ?', [seller_new_eth_balance, seller.id], (error, results, fields) => {
                res.status(200).json({
                  code: 200,
                  message: "Order purchased successfully. Your balance may take a few minutes to update."
                });
              });

            }).catch((e) => {
              res.status(200).json({
                code: 400,
                message: e
              })
            });
          } else {
            res.status(200).json({
              code: 400,
              message: "You can't buy your own order, lmao."
            })
          }
        }).catch((e) => {
          console.log(e);
        });
      } else {
        res.status(200).json({
          code: 400,
          message: "This order has already been purchased!"
        })
      }
    });
  }
});

app.get("/api/shop", (req, res) => {
  connection.query('SELECT * FROM shop ORDER BY id+0 DESC', (error, results, fields) => {
    res.status(200).json({
      code: 200,
      shop: results
    })
  });
});

app.get("/api/balance", (req, res) => {
  const { wallet } = req.session;
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

app.get("/api/ethereum/balance", (req, res) => {
  const { userId } = req.session;
  connection.query('SELECT * FROM users WHERE id = ?', [userId], (error, results, fields) => {
    res.status(200).json({
      code: 200,
      balance: results[0].eth_balance
    })
  });
});

app.post("/api/burn", (req, res) => {
  const { quantity, password } = req.body;
  const { wallet, userId } = req.session;
  getUser(userId).then((user) => {
    bcrypt.compare(`${password}${salt}`, user.password, (err, compared) => {
      if (compared) {
        contract.burn(wallet, quantity).then(() => {
          res.status(200).json({
            code: 200,
            message: "Tokens burned successfully. Your wallet may take a few minutes to update."
          });
        }).catch((e) => {
          res.status(200).json({
            code: 400,
            error: e
          })
        });
      } else {
        res.status(200).json({
          code: 400,
          message: "Invalid Password"
        });
      }
    });
  }).catch((e) => {
    res.status(200).json({
      code: 400,
      error: e
    })
  });    
});

// set smart contract tokens available, utility
app.get("/api/utils/set/:amount", (req, res) => {
  const { amount } = req.params;
  contract.set(amount).then(() => {
    res.status(200).json({
      code: 200,
      message: `Tokens available set to ${amount}.`
    });
  })
});

// set smart contract investors, give them tokens, utility
app.get("/api/utils/investors/:wallets", (req, res) => {
  let { wallets } = req.params;
  wallets = wallets.split(",");
  const tokens = [10000/0.01, 25000/0.01, 100000/0.01];

  contract.AirDrop(wallets, tokens).then(() => {
    res.status(200).json({
      code: 200,
      message: `Tokens set to investors.`
    });
  })
});

// burn tokens from an address, utility
app.get("/api/utils/burn/:wallet/:quantity", (req, res) => {
  const { wallet, quantity } = req.params;
  contract.burn(wallet, quantity).then(() => {
    res.status(200).json({
      code: 200,
      message: "Tokens burned successfully."
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
  res.sendFile('404.html', dir);
});

// listen
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});