const logged = (req) => {
  return new Promise((resolve, reject) => {
    !req.session.userId ? reject() : resolve()
  });
}

const getTransactions = (userId, connection) => {
  connection.query('SELECT * FROM transactions WHERE sender_id = ?', [userId], (error, results, fields) => {
    return results;
  });
}

const randomString = (length) => {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

module.exports = { 
  logged: logged,
  randomString: randomString,
  getTransactions: getTransactions
}