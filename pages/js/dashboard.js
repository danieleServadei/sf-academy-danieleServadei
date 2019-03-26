const table = document.getElementById('transactions-table');

const getTransactions = () => {
  fetch(`${config.url}/api/user/transactions`)
  .then((res) => {
    res.json().then((response) => {
      table.innerHTML = "";
      const { transactions } = response;
      for (let s in transactions) {
        let { username, price, tokens, date, status, buyerId } = transactions[s];
        let type;
        if (!buyerId) {
          type = `<a href="#" class="mb-0 btn-sm btn btn-outline-success round">Sell</a>`;
        } else {
          type = `<a href="#" class="mb-0 btn-sm btn btn-outline-info round">Buy</a>`;
        }

        table.insertAdjacentHTML('afterend', `
          <tr>
            <td class="text-truncate">${username}</td>
            <td class="text-truncate">$ ${price}</td>
            <td class="text-truncate">${(price*config.USDinETH).toFixed(4)} ETH</td>
            <td class="text-truncate">SF ${tokens}</td>
            <td>${date}</td>
            <td>${type}</td>
          </tr>`);
      }
    });
  })
  .catch((err) => {
    console.log(`Fetch Error :-S ${err}`);
  });
}

getTransactions();