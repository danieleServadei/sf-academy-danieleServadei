const button = document.getElementById('register-button');
button.onclick = () => {
  register();
}

document.addEventListener('keypress', (e) => {
  let key = e.which || e.keyCode;
  if (key === 13) {
    register();
  }
});

const register = () => {
  let name = document.getElementById('name').value;
  let password = document.getElementById('password').value;
  let email = document.getElementById('email').value;
  let responseDiv = document.getElementById('response');

  if (!email || !password || !name) {
    responseDiv.innerHTML = "Insert both username and password";
    return;
  }

  fetch(`${config.url}/api/register`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: name,
      password: password,
      email: email
    })
  })
  .then((res) => {
    res.json().then((response) => {
      if (response.code == 200) {
        window.location.href = "login";
      } else {
        responseDiv.innerHTML = response.message;
      }
    });
  })
  .catch((err) => {
    console.log(`Fetch Error :-S ${err}`);
  });
}