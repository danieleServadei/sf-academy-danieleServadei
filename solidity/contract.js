const Web3 = require("web3");
const path = require("path")
const cjson = require("cjson")
const TX = require('ethereumjs-tx')
// Config and credentials
const fs = require("fs");
const { config } = require(`../config`);
// contract details
const provider = config.provider;
const contractAddress = config.contractAddress;
const privateKey = new Buffer.from(config.privateKey, "hex");
const defaultAccount = config.defaultAccount;
const etherscanLink = config.etherscanLink;
// initiate the web3
const web3 = new Web3(provider)
const abi = JSON.parse(fs.readFileSync(`${__dirname}/abi.json`, "utf8"));
const contract = new web3.eth.Contract(abi, contractAddress);
const { toHex, toAscii } = web3.utils

// Create a new wallet
const createWallet = (wallet) => {
  wallet = toHex(wallet);
  return new Promise((resolve, reject) => {
    const create = contract.methods.createWallet(wallet);
    resolve(sendSignTransaction(create));
  });
}

// add tokens into a wallet
const addFounds = (wallet, toAdd) => {
  wallet = toHex(wallet);
  return new Promise((resolve, reject) => {
    const add = contract.methods.addFounds(wallet, toAdd);
    resolve(sendSignTransaction(add));
  });
}

// remove tokens from a wallet
const burn = (wallet, toRemove) => {
  wallet = toHex(wallet);
  return new Promise((resolve, reject) => {
    const remove = contract.methods.burn(wallet, toRemove);
    resolve(sendSignTransaction(remove));
  });
}

// transfer tokens between two wallets
const transfer = (walletBuyer, walletSeller, price) => {
  return new Promise((resolve, reject) => {
    balanceWalletSeller = getWalletBalance(walletSeller).then((balance) => {
      balance = parseFloat(balance);
      price = parseFloat(price);
      if (balance < price) {
        reject("Seller does not have enough tokens.");
      }

      walletBuyer = toHex(walletBuyer);
      walletSeller = toHex(walletSeller);

      const transfer = contract.methods.transfer(walletBuyer, walletSeller, price);
      resolve(sendSignTransaction(transfer));
    });
  });
}

// array recipients, array values, assegna i token ai recipients.
const AirDrop = (recipients, values) => {
  toHexRecipients = [];
  for (let i in recipients) {
    toHexRecipients.push(toHex(recipients[i]));
  }
  return new Promise((resolve, reject) => {
    const airdrop = contract.methods.AirDrop(toHexRecipients, values);
    resolve(sendSignTransaction(airdrop));
  });
}

// get tokens balance of a wallet
const getWalletBalance = (wallet) => {
  wallet = toHex(wallet);
  return new Promise((resolve, reject) => {
    const call = contract.methods.walletBalance(wallet).call().then((val) => {
      resolve(val);
    })
  });
}

// set tokens available
const set = (amount) => {
  return new Promise((resolve, reject) => {
    const update = contract.methods.set(amount);
    resolve(sendSignTransaction(update));
  });
}

// total ICO tokens availabe
const getTokensAvailable = () => {
  return new Promise((resolve, reject) => {
    const call = contract.methods.tokensAvailable().call().then((val) => {
      resolve(val);
    })
  });
}

const sendSignTransaction = async (rawTrans) => {
  // Initiate values required by the dataTrans
  if (rawTrans) {
    let txCount = await web3.eth.getTransactionCount(defaultAccount) // needed for nonce
    let abiTrans = rawTrans.encodeABI() // encoded contract method 

    let gas = await rawTrans.estimateGas()
    let gasPrice = await web3.eth.getGasPrice()
    gasPrice = Number(gasPrice)
    gasPrice = gasPrice * 2.3
    let gasLimit = gas * 4
    // Initiate the transaction data
    let dataTrans = {
      nonce: web3.utils.toHex(txCount),
      gasLimit: web3.utils.toHex(gasLimit),
      gasPrice: web3.utils.toHex(gasPrice),
      to: contractAddress,
      data: abiTrans
    }

    // sign transaction
    let tx = new TX(dataTrans)
    tx.sign(privateKey)
    // after signing send the transaction
    return await sendSigned(tx)
  } else {
    throw new console.error("Encoded raw transaction was not given.");
  }

}

const sendSigned = async (tx) => {
  return new Promise((resolve, reject) => {
    // send the signed transaction
    web3.eth.sendSignedTransaction("0x" + tx.serialize().toString("hex"))
      .once("transactionHash", (hash) => {
        let result = {
          "status": "sent",
          "url": etherscanLink + hash,
          "message": "click the given url to verify status of transaction"
        }
        // respond with the result
        resolve(result)
      })
      .then(out => {
        console.log(out)
      })
      .catch(err => {
        // respond with error
        reject(err)
      })
  })
}

// convert Wei to Eth
const convertWeiToEth = (stringValue) => {
  if (typeof stringValue != "string") {
    stringValue = String(stringValue);
  }
  return web3.utils.fromWei(stringValue, "ether");
}

module.exports = {
  createWallet: createWallet,
  addFounds: addFounds,
  burn: burn,
  set: set,
  transfer: transfer,
  AirDrop: AirDrop,
  getWalletBalance: getWalletBalance,
  getTokensAvailable: getTokensAvailable
}