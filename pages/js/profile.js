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