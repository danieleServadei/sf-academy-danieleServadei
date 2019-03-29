// ExpressJS
const express = require("express");
const app = express();
// Mysql
const mysql = require("mysql");
// Bcrypt, hash password
const bcrypt = require('bcrypt');
// Config and credentials
const fs = require("fs");
const { config } = require("./config");
// MySQL DB setup
const { setup } = require("./setup");
// Salt and Rounds for Bcrypt hashing
const salt = config.salt;
const rounds = config.rounds;
// Body parser and Express session
const bodyParser = require("body-parser")
const session = require("express-session");
// Functions
const { logged, randomString, getUser, getShopOrdersValue, getOrder, getTransactions } = require("./functions");
const port = 3000;
// Solidity Smart Contract
const contract = require(`${__dirname}/solidity/contract`);

// pages root directory
const dir = {
  root: `${__dirname}/pages`
};

// Connect to RDS DB
const connection = mysql.createPool({
  host: config.mysqlHost,
  user: config.mysqlUser,
  password: config.mysqlPassword,
  database: config.mysqlDB
});
connection.connect();

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

// Serve static pages, with their root directory

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

API structure
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
            res.redirect("/login");
          });
        });
      });
    }
  });
});

app.get("/api/user", (req, res) => {
  const { userId } = req.session;
  getUser(userId).then((user) => {
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
      transactions: result,
      sessionUserId: userId
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

  getUser(userId)
  .then((user) => {
    if (user.eth_balance < ETHprice) {
      return new Promise((resolve, reject) => {
        reject("You do not have enough ETH in your wallet, please deposit more ETH in order to complete this transaction.");
      });
    }
    return user;
  })
  .then((user) => {
    contract.addFounds(wallet, tokens)
    return user;
  })
  .then((user) => {
    let newEthBalance = user.eth_balance - ETHprice;
    connection.query('UPDATE users SET eth_balance = ? WHERE id = ?;', [newEthBalance, userId], (error, results, fields) => {
      if (error) throw error;
      res.status(200).json({
        code: 200,
        message: "Transaction completed successfully, you may need to wait a few minutes in order to see your balance updated."
      });
    });
  })
  .catch((error) => {
    res.status(200).json({
      code: 400,
      error: error
    })
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
    Promise.all([getShopOrdersValue(userId), contract.getWalletBalance(wallet)]).then(values => {
      let [ trValue, balance ] = values;
      trValue += parseFloat(amount);
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
  }
});

app.post("/api/transfer", (req, res) => {
  const { orderId, amount, price } = req.body;
  const { wallet, userId } = req.session;
  const eth_price = price*config.USDinETH;

  Promise.all([getUser(userId), getOrder(orderId)]).then(values => {
    const [ user, order ] = values;
    if (user.eth_balance < eth_price) {
      res.status(200).json({
        code: 400,
        message: "You do not have enough ETH deposited in your wallet to complete the transaction."
      })
    } else if (order.status == "available") {
      getUser(order.userId)
      .then((seller) => {
        if (seller.id != userId) {
          contract.transfer(wallet, seller.wallet, amount);
          return new Promise((resolve, reject) => {
            resolve(seller);
          })
        } else {
          res.status(200).json({
            code: 400,
            message: "You can't buy your own order, lmao."
          })
        }
      }).then((seller) => {
        new_eth_balance = user.eth_balance - eth_price;
        connection.query('UPDATE users SET eth_balance = ? WHERE id = ?', [new_eth_balance, userId]);
        connection.query('UPDATE shop SET status = "purchased", buyerId = ? WHERE id = ?', [userId, orderId]);

        seller_new_eth_balance = seller.eth_balance + eth_price;
        connection.query('UPDATE users SET eth_balance = ? WHERE id = ?', [seller_new_eth_balance, seller.id], (error, results, fields) => {
          res.status(200).json({
            code: 200,
            message: "Order purchased successfully. Your balance may take a few minutes to update."
          });
        });
      })
    } else {
      res.status(200).json({
        code: 400,
        message: "This order has already been purchased!"
      })
    }
  });
});

app.get("/api/shop", (req, res) => {
  connection.query('SELECT * FROM shop ORDER BY id DESC', (error, results, fields) => {
    res.status(200).json({
      code: 200,
      shop: results
    })
  });
});

app.get("/api/balance", (req, res) => {
  const { wallet } = req.session;
  contract.getWalletBalance(wallet)
  .then((balance) => {
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
  getUser(userId)
  .then((user) => {
    return bcrypt.compare(`${password}${salt}`, user.password);
  })
  .then((compared) => {
    if (compared) {
      return contract.burn(wallet, quantity)
    } else {
      return new Promise((resolve, reject) => {
        reject("Invalid Password");
      });
    }
  })
  .then(() => {
    res.status(200).json({
      code: 200,
      message: "Tokens burned successfully. Your wallet may take a few minutes to update."
    });
  })
  .catch((error) => {
    res.status(200).json({
      code: 400,
      error: error
    })
  })
});

// set smart contract tokens available, utility
app.get("/api/utils/set/:amount", (req, res) => {
  const { amount } = req.params;
  contract.set(amount)
  .then(() => {
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

  if (wallets.length <= 3) {
    contract.AirDrop(wallets, tokens)
    .then(() => {
      res.status(200).json({
        code: 200,
        message: `Tokens set to investors.`
      });
    })
  } else {
    res.status(200).json({
      code: 400,
      message: `You must insert only 3 investors.`
    });
  }
});

// burn tokens from an address, utility
app.get("/api/utils/burn/:wallet/:quantity", (req, res) => {
  const { wallet, quantity } = req.params;
  contract.burn(wallet, quantity)
  .then(() => {
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

// configure the DB, create tables etc. NOTE: the database with name "sfacademy" must be already created.
app.get("/api/utils/setup", (req, res) => {
  connection.query(setup.users);
  connection.query(setup.shop);
  res.status(200).json({
    code: 200,
    message: "Tables created, app ready to use."
  })
});

// catch 404 error
app.get("*", (req, res) => {
  res.sendFile('404.html', dir);
});

// listen
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});