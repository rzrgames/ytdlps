

const cookies = `PREF=f6=40000000&tz=Asia.Jakarta&f7=100; GPS=1; __Secure-1PSIDTS=sidts-CjIBjplskJJ4ohq-ClEsZgDETLE50JqK03B_GJptTqz8PIip91IUs9IZPJ70DdtTpnSQzxAA; __Secure-3PSIDTS=sidts-CjIBjplskJJ4ohq-ClEsZgDETLE50JqK03B_GJptTqz8PIip91IUs9IZPJ70DdtTpnSQzxAA; HSID=AQTtmzbZaruNQ0XHb; SSID=AajBBOEZzGwFNsXMM; APISID=GLWC_qG1Uj2GsieB/AT56A5U_Rt7sMzXmk; SAPISID=HwScfpCooVn7d4uN/AF8kd6sPqPC3Klkq0; __Secure-1PAPISID=HwScfpCooVn7d4uN/AF8kd6sPqPC3Klkq0; __Secure-3PAPISID=HwScfpCooVn7d4uN/AF8kd6sPqPC3Klkq0; SID=g.a000xAgm7GQNXHtlkKVJs9yxy6YvrTAIQXGmhWQPxmCmauZoqZahSvbnTuW6PfRrXgkbCCIpTgACgYKAcESAQASFQHGX2MiDaQxpepGJWHe2q0NDFYzbBoVAUF8yKprFLUfmpEXMM9Qp_46Wy7t0076; __Secure-1PSID=g.a000xAgm7GQNXHtlkKVJs9yxy6YvrTAIQXGmhWQPxmCmauZoqZahiRu6rhAGJOdQb-YgSpD3awACgYKAX4SAQASFQHGX2Mi3iFu3qXnx6bt-G-6NaX8_hoVAUF8yKpPt7tezsIKvU_TslgYMQZW0076; __Secure-3PSID=g.a000xAgm7GQNXHtlkKVJs9yxy6YvrTAIQXGmhWQPxmCmauZoqZahXvhEZj5UbWTPV8s70j1ihwACgYKARESAQASFQHGX2Mi3PzlJxWw_icleAjZqv1VCRoVAUF8yKrC-Afuxb8tu3KaWRwKcNNM0076; LOGIN_INFO=AFmmF2swRQIgXqdshiq-NLatUBZxeOOk0gzJQH_cvvD1nNUnWbS6li8CIQCvhDMG8bcJVafulMj0_-5vKSrTW060cm7Wq4WAjyO1Jg:QUQ3MjNmeGJyNXJBcjBtUzhjcmNJU01CZkdFM3J6ejVaek1nV05hcW1nekhWMjdCS2V1TDZUZ1hWVXBRSTRNdUlMUW5lbGFYdHFlSE0zN0VRVnlJQm1tMkFHbnBqb3ZUVUozMG9oY0pXNlhjOG12UU9CUERlWUVmRXlDVkdGVko2QzRVVlUxSjM5ZHpObWtrU3N5bHQwNjNjYnc1aDVoRXRR; SIDCC=AKEyXzVMcTD2yarFFS7eG5cfD6IYcrjvYBpcV7DvDzwb2mEYIBar7agaf0TgTeqUlz_ukOg97w; __Secure-1PSIDCC=AKEyXzXPN7CTZt2CokARdk-w6ogRuXeLdWqXBRSWXXzWWLeoGEeMQRotEyLKmzHY8DMeywIA3w; __Secure-3PSIDCC=AKEyXzVeJFWV-9MLiFaXVfk0tiqvpMSKtEbNx573YUdI-ys7LEs9rrw7rsxnmJaC7DGZ_J8b1A`;

const http = require('http');
const url = require('url');
const ytdl = require('ytdl-core');

// Paste your raw cookies here (string format like "SID=...; HSID=...")
//const cookies = 'YOUR_COOKIES_HERE';
const userAgent = 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 Chrome/121 Safari/537.36';

const PORT = 3000;

http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const videoUrl = parsed.query.url;

  if (parsed.pathname === '/info' && videoUrl) {
    try {
      const info = await ytdl.getInfo(videoUrl, {
        requestOptions: {
          headers: {
            cookie: cookies,
            'User-Agent': userAgent,
          }
        }
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(info.videoDetails, null, 2));
    } catch (err) {
      res.writeHead(500);
      res.end('Error: ' + err.message);
    }
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Use /info?url=...');
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});