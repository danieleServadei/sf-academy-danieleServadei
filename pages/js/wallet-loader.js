fetch(`${config.url}/api/balance`)
.then((res) => {
  res.json().then((response) => {
    if (response.code == 200) {
      document.getElementById("token-balance").innerHTML = `${response.balance} SF`;
      if (window.location.pathname == "/profile" || window.location.pathname == "/wallet") {
        document.getElementById("wallet-value").innerHTML = `<i class="la la-dollar"></i>${response.balance*0.05}`;
      }
    } else {
      console.log(response)
    }
  });
})
.catch((err) => {
  console.log(`Fetch Error :-S ${err}`);
});