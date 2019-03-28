module.exports = {
  config: {
    mysqlHost: process.env.mysqlHost,
    mysqlUser: process.env.mysqlUser,
    mysqlPassword: process.env.mysqlPassword,
    mysqlDB: process.env.mysqlDB,
    salt: process.env.bcryptSalt,
    rounds: 10,
    provider: process.env.provider,
    contractAddress: process.env.contractAddress,
    privateKey: process.env.privateKey,
    defaultAccount: process.env.defaultAccount,
    etherscanLink: process.env.etherscanLink,
    ETHInUSD: 135,
    USDinETH: 0.0075
  }
};