const http = require('http');
const url = require('url');
const { gotScraping } = require('got-scraping')

// TODO: This whole handler should be refactored, it's a mess, I've not written pure HTTP for a long time
// - or maybe refactor to use Express, Hono, Hapi, etc.
http.createServer(async function (req, res) {
  const urlObj = url.parse(req.url, true);

  const {
    targetUrl,
    apiKey,
    advanced = 'groups-RESIDENTIAL',
    mode = 'pass-through', // pass to client response as is instead of wrapping into JSON
  } = urlObj.query;

  if (urlObj.pathname !== '/scrape') {
    res.writeHead(404, { 'Content-type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const gotOptions = {
    url: targetUrl
  };
  if (apiKey) gotOptions.context = {
    proxyUrl: `http://${advanced}:${apiKey}@proxy.apify.com:8000`,
  }

  res.setHeader('Access-Control-Allow-Origin', '*');


  let gotRes;
  try {
    gotRes = await gotScraping(gotOptions);
    const { headers, statusCode, statusMessage, body } = gotRes;

    if (mode === 'pass-through') {
      res.writeHead(statusCode, statusMessage, headers);
      res.end(body);
    } else {
      res.writeHead(200, { 'Content-type': 'application/json' });
      res.end(JSON.stringify({
        headers,
        statusCode,
        statusMessage,
        body
      }))
    }
  } catch (err) {
    res.end(JSON.stringify({
      headers: {},
      statusCode: 500,
      statusMessage: err.code,
      body: err.message
    }))
  }
}).listen(process.env.PORT || 8080);

console.log(`Server listening on port ${process.env.PORT || 8080}`);
