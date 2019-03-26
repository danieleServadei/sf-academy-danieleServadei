const button = document.getElementById('place-order');
const purchaseButton = document.getElementById('purchase-order');
const responseDiv = document.getElementById('response');
const responsePurchaseDiv = document.getElementById('response-purchase');
const table = document.getElementById('orders-table');

button.onclick = () => {
  createOrder();
}

purchaseButton.onclick = () => {
  purchaseOrder();
}

const createOrder = () => {
  let amount = document.getElementById('sf-amount').value;
  let price = document.getElementById('sf-price').value;

  fetch(`${config.url}/api/order`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount,
      price: price,
    })
  })
  .then((res) => {
    res.json().then((response) => {
      if (response.code == 200) {
        responseDiv.innerHTML = `<span style='color:#2ecc71'>${response.message}</span>`;
      } else {
        responseDiv.innerHTML = `<span style='color:#e74c3c'>${response.message}</span>`;
      }
    });
  })
  .catch((err) => {
    console.log(`Fetch Error :-S ${err}`);
  });
}

const getShop = () => {
  fetch(`${config.url}/api/shop`)
  .then((res) => {
    res.json().then((response) => {
      table.innerHTML = "";
      const { shop } = response
      for (let s in shop) {
        let { id, username, price, tokens, date, status } = shop[s];
        let statusColor = "danger";
        let cursor = "";
        let onclick = "";
        if (status == "available") {
          statusColor = "success";
          cursor = "cursor: pointer;";
          onclick = `onclick="edit(${price}, ${tokens}, ${id});"  data-toggle="modal" data-target="#purchaseOrderModal"`;
        }

        table.insertAdjacentHTML('afterend', `
          <section class="card pull-up" ${onclick}>
            <div class="card-content" style="${cursor}">
              <div class="card-body">
                <div class="col-12">
                  <div class="row">
                    <div class="col-md-2 col-12 py-1">
                      <p class="mb-0">${username}</p>
                    </div>
                    <div class="col-md-2 col-12 py-1">
                      <p class="mb-0">$ ${price}</p>
                    </div>
                    <div class="col-md-2 col-12 py-1">
                      <p class="mb-0">${(price*config.USDinETH).toFixed(4)} ETH</p>
                    </div>
                    <div class="col-md-2 col-12 py-1">
                      <p class="mb-0">SF ${tokens}</p>
                    </div>
                    <div class="col-md-2 col-12 py-1">
                      <p class="mb-0">${date}</p>
                    </div>
                    <div class="col-md-2 col-12 py-1">
                      <a href="#order" class="mb-0 btn-sm btn btn-outline-${statusColor} round">${status}</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section`);
      }
    });
  })
  .catch((err) => {
    console.log(`Fetch Error :-S ${err}`);
  });
}

const edit = (tokensPrice, tokens, orderId) => {
  let amount = document.getElementById("sf-amount-purchase");
  let price = document.getElementById("sf-price-purchase");
  let id = document.getElementById("sf-id-purchase");

  amount.value = tokens;
  price.value = tokensPrice;
  id.value = orderId;
}

const purchaseOrder = () => {
  const amount = document.getElementById("sf-amount-purchase").value;
  const price = document.getElementById("sf-price-purchase").value;
  const orderId = document.getElementById("sf-id-purchase").value;

  fetch(`${config.url}/api/transfer`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount,
      price: price,
      orderId: orderId
    })
  })
  .then((res) => {
    res.json().then((response) => {
      if (response.code == 200) {
        responsePurchaseDiv.innerHTML = `<span style='color:#2ecc71'>${response.message}</span>`;
      } else {
        responsePurchaseDiv.innerHTML = `<span style='color:#e74c3c'>${response.message}</span>`;
      }
    });
  })
  .catch((err) => {
    console.log(`Fetch Error :-S ${err}`);
  });
}

getShop();