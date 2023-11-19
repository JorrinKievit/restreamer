const express = require('express');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer();

const server = express();

server.get('/proxy/:url', (req, res) => {
  const targetURL = new URL(decodeURIComponent(req.params.url));
  const accountToken = req.query.accountToken;
  const referer = encodeURIComponent(req.query.referer);

  req.url = targetURL.toString();

  proxy.web(req, res, {
    target: targetURL.origin,
    changeOrigin: true,
    headers: {
      host: targetURL.host,
      ...(accountToken && {
        cookie: `accountToken=${accountToken}`,
      }),
      ...(referer && {
        referer,
      }),
    },
  });
});

server.listen(7688, () => {
  console.log('Server is running on port 3000');
});
