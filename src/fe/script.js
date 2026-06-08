const getIO = (token) => {
  const client = io('http://localhost:3000', {
    extraHeaders: { token: token },
  });
  return client;
};
const ioEvents = (client) => {
  client.on('hi', (res) => {
    document.getElementsByTagName('h1')[0].textContent = res;
  });
};
async function bootstrap() {
  let token =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZmRkMmI1N2UxYmI4MjM0ZDBhYmY1ZSIsImlhdCI6MTc4MDgwNjg1OSwiZXhwIjoxNzgwODA4NjU5LCJqdGkiOiI3YWRmYTlhOS1iN2NiLTQyNTctOTRkNC05NDFhODkzOGQzZDQifQ.GDUu-jtPePZAQegMmfzIsQshVzf7OpMrqx1t2GstUFU';
  let client = getIO(token);
  ioEvents(client);
  await client.on('connect_error', async (err) => {
    if (err.message === 'Authentication error') {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@gmail.com',
          password: 'Ahmed123',
          fcmToken:
            'fp2sik1Gbh97fyVCIvdSzE:APA91bEUWm_7sXXVF-z9bKwKqcSRCRAJeF2mG_R3fVK4Dga1Rgi91s_lcymVLglT1CiLvAsagzEaiRl59yLvhy363BEgrdaEclOSA_lvDks9WuI0lV-fkgg',
        }),
      });
      const data = await res.json();
      client.disconnect();
      client = getIO('Bearer ' + data.accessToken);
      ioEvents(client);
    }
  });
}
bootstrap();
