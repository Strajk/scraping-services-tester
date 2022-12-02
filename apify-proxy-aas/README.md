# apify-proxy-aas (Apify Proxy as a Service)

Apify Proxy currently does not have the "API mode" – endpoint that would
- accept target url, credentials, and other parameters in URL parameters
- use gotScraping (Apify's HTTP request library) to fetch the target URL
- using Apify Proxy with specified credentials and configuration
- pass the response back to the caller

This repo is a proof of concept of such API.

It's not a production ready product, it runs on a free tier of Fly.io, so it works only until it runs out of free credits.

#### Deployment

* Run `flyctl deploy` ¯\_(ツ)_/¯, that's all

