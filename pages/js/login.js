const button = document.getElementById('login-button');
button.onclick = () => {
  login();
}

document.addEventListener('keypress', (e) => {
  let key = e.which || e.keyCode;
  if (key === 13) {
    login();
  }
});

const login = () => {
  let email = document.getElementById('email').value;
  let password = document.getElementById('password').value;
  let responseDiv = document.getElementById('response');

  if (!email || !password) {
    responseDiv.innerHTML = "Insert both username and password";
    return;
  }

  fetch(`${config.url}/api/login`, {
    method: 'post',
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
}