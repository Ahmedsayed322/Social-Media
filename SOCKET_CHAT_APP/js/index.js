const baseURL = 'http://localhost:3000';

$('#login').click(() => {
  const email = $('#email').val();
  const password = $('#password').val();
  const data = {
    email,
    password,
  };
  console.log({ data });
  axios({
    method: 'post',
    url: `${baseURL}/api/auth/login`,
    data: data,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  })
    .then(function (response) {
      console.log({ data: response.data });

      const { success, accessToken } = response.data;
      if (success == true) {
        localStorage.setItem('token', accessToken);
        window.location.href = 'chat.html';
      } else {
        console.log('In-valid email or password');
        alert('In-valid email or password');
      }
    })
    .catch(function (error) {
      console.log({ error });
    });
});
