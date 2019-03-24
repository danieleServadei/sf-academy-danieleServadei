const Web3 = require("web3");
const path = require("path")
const cjson = require("cjson")
const TX = require('ethereumjs-tx')
// Config and credentials
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
// contract details
const provider = config.provider;
const contractAddress = config.contractAddress;
const privateKey = new Buffer.from(config.privateKey, "hex");
const defaultAccount = config.defaultAccount;
const etherscanLink = config.etherscanLink;
// initiate the web3
const web3 = new Web3(provider)
const abi = cjson.load(path.resolve("abi.json"));
const contract = new web3.eth.Contract(abi, contractAddress);


/*

TODO
smart contract functions
backend and frontend related

*/


// functions
const voteForCandidate = (bytes32) => {
  const voted = contract.methods.voteForCandidate(bytes32);
  return sendSignTransaction(voted);
}

const totalVotesFor = (bytes32) => {
  return new Promise((resolve, reject) => {
    const call = contract.methods.totalVotesFor(bytes32).call().then((val) => {
      resolve(val);
    })
  });
}

const getAddress = (candidate) => {
  const bytes32 = web3.utils.asciiToHex(candidate);
  return bytes32;
}

const isValid = (bytes32) => {
  return new Promise((resolve, reject) => {
    const call = contract.methods.validCandidate(bytes32).call().then((val) => {
      resolve(val);
    })
  });
}

// initiate the contract with null value
let contract = null;

// convert Wei to Eth
const convertWeiToEth = (stringValue) => {
  if (typeof stringValue != "string") {
    stringValue = String(stringValue);
  }
  return web3.utils.fromWei(stringValue, "ether");
}

const sendSignTransaction = async (rawTrans) => {
  // Initiate values required by the dataTrans
  if (rawTrans) {
    let txCount = await web3.eth.getTransactionCount(defaultAccount) // needed for nonce
    let abiTrans = rawTrans.encodeABI() // encoded contract method 

    let gas = await rawTrans.estimateGas()
    let gasPrice = await web3.eth.getGasPrice()
    gasPrice = Number(gasPrice)
    gasPrice = gasPrice * 2
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

module.exports = {
  vote: voteForCandidate,
  getVotes: totalVotesFor,
  getAddress: getAddress,
  valid: isValid,
  web3: web3
}