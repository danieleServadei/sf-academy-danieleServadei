const button = document.getElementById('update-profile-button');
button.onclick = () => {
  updateProfile();
}

document.addEventListener('keypress', (e) => {
  let key = e.which || e.keyCode;
  if (key === 13) {
    updateProfile();
  }
});

const profileInfo = () => {
  const registerDate = document.getElementById('register-date');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const walletInput = document.getElementById('wallet-input');

  fetch(`${config.url}/api/user`)
  .then((res) => {
    res.json().then((response) => {
      const { register_date, username, email, wallet} = response.user;
      if (response.code == 200) {
        registerDate.innerHTML = register_date;
        usernameInput.value = username;
        emailInput.value = email;
        walletInput.value = wallet;
      } else {
        console.log(response.message)
      }
    });
  })
  .catch((err) => {
    console.log(`Fetch Error :-S ${err}`);
  });
}

const updateProfile = () => {
  let username = document.getElementById('username').value;
  let oldPassword = document.getElementById('old-password').value;
  let newPassword = document.getElementById('new-password').value;
  let responseDiv = document.getElementById('response');

  if (newPassword && !oldPassword) {
    responseDiv.innerHTML = "Insert both new and old password";
    return;
  }

  if (!username) {
    responseDiv.innerHTML = "Insert a valid username";
    return;
  }

  fetch(`${config.url}/api/updateProfile`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      oldPassword: oldPassword,
      newPassword: newPassword
    })
  })
  .then((res) => {
    res.json().then((response) => {
      responseDiv.innerHTML = response.message;
    });
  })
  .catch((err) => {
    console.log(`Fetch Error :-S ${err}`);
  });
}

profileInfo();