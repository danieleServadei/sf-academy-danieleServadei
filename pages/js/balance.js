fetch(`${config.url}/api/balance/${}`, {
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: email,
    password: password
  })
})
.then((res) => {
  res.json().then((response) => {
    if (response.code == 200) {
      window.location.href = "dashboard";
    } else {
      responseDiv.innerHTML = response.message;
    }
  });
})
.catch((err) => {
  console.log(`Fetch Error :-S ${err}`);
});

document.getElementById("token-balance").innerHTML = balance;