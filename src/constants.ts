import fetchNoCors from "fetch-no-cors"
import {FormTogglesValues, FormTokensValues, Services} from "./types";

const genericTokenPlaceholder = `abc123...`

export const examples = [
  ['GitHub profile w/o protection', `https://api.github.com/users/strajk`],
  ['StarWars API w/o protection', 'https://swapi.dev/api/people/1/?format=json'],
  ['StockX API behind PerimeterX', 'https://stockx.com/api/products/a84b0299-c372-4828-b926-5579c076bdc6/activity?limit=10&page=1&sort=createdAt&order=DESC&state=480&currency=EUR&country=US'],
  ['Bike24 product behind Cloudflare', 'https://www.bike24.com/p2160000.html'],
]

export const services: Services = {
  fetch: {
    name: 'Native Fetch',
    desc: "…",
    fn: (url) => {
      return fetch(url);
    }
  },
  apify: {
    name: 'Apify',
    tokenLength: 25,
    tokenRegex: /^[a-zA-Z]{25}$/,
    tokenHint: '25 chars long, lowercase and uppercase letters',
    tokenPlaceholder: 'bkNb...',
    desc: '…',
    fn: async (url, token) => {
      const endpoint = `https://apify-proxy-aas.fly.dev`
      // const endpoint = `http://localhost:8080` // uncomment for local testing
      return await fetch(`${endpoint}/scrape?` + new URLSearchParams({
        apiKey: token,
        targetUrl: url,
        // TODO: More params
      }))
    }
  },
  scrapingbee: {
    name: 'ScrapingBee',
    desc: '…',
    tokenLength: 80,
    tokenRegex: /^[A-Z0-9]{80}$/,
    tokenHint: '80 chars long, uppercase letters and numbers',
    tokenPlaceholder: 'IG6CGY...',
    fn: async (url, token) => {
      // https://www.scrapingbee.com/documentation/
      return fetch('https://app.scrapingbee.com/api/v1?' + new URLSearchParams({
        api_key: token,
        url,
        // premium_proxy: 'true',
        // stealth_proxy: 'true',
        // country_code: 'us',
      }))
    }
  },
  scrapingdog: {
    name: 'ScrapingDog',
    tokenLength: 25,
    tokenRegex: /^[a-z0-9]{25}$/,
    tokenHint: '25 chars long, lowercase letters and numbers',
    tokenPlaceholder: 's6386...',
    desc: '…',
    fn: async (url, token) => {
      // https://www.scrapingdog.com/documentation
      return fetch('https://api.scrapingdog.com/scrape?' + new URLSearchParams({
        api_key: token,
        url,
        dynamic: 'false',
        premium: '', // TODO: 'yes' or 'true', string according to docs
      }))
    }
  },
  scrapingowl: {
    name: 'ScrapingOwl',
    tokenLength: 30,
    tokenRegex: /^[a-z0-9]{30}$/,
    tokenHint: '30 chars long, lowercase letters and numbers',
    tokenPlaceholder: '386a...',
    desc: '…',
    fn: async (url, token) => {
      // https://www.scrapingowl.com/documentation
      return fetch('https://api.scrapingowl.com/scrape?' + new URLSearchParams({
        api_key: token,
        url,
        premium_proxies: 'true',
        /*
        [
          "br",
          "ca",
          "fr",
          "de",
          "ge",
          "il",
          "it",
          "mx",
          "nl",
          "ru",
          "es",
          "se",
          "uk",
          "us"
        ]
        */
        country: 'us', // TODO: 'yes' or 'true', string according to docs
      }))
    }
  },
  scraperapi: {
    name: 'ScraperAPI',
    tokenPlaceholder: genericTokenPlaceholder,
    desc: '…',
    fn: async (url, token) => {

    }
  },
  zenrows: {
    name: 'ZenRows',
    tokenLength: 40,
    tokenRegex: /^[a-z0-9]{40}$/,
    tokenHint: '40 chars long, lowercase letters and numbers',
    tokenPlaceholder: '739a...',
    desc: '…',
    fn: async (url, token) => {
      // https://www.zenrows.com/documentation#overview-node
      // https://app.zenrows.com/builder
      return fetchNoCors('https://api.zenrows.com/v1/?' + new URLSearchParams({
        apikey: token, // beware: all lowercase!
        url,
        premium_proxy: 'false',
        antibot: 'false', // TODO: Enable with paid plan tokens
      }))

    }
  },
}
export const tokensInitial: FormTokensValues = Object.entries(services).reduce((acc, [key, value]) => {
  acc[key] = '';
  return acc;
}, {});
export const togglesInitial: FormTogglesValues = Object.entries(services).reduce((acc, [key, value]) => {
  acc[key] ??= false;
  return acc;
}, {
  fetch: true, // Enable 'fetch' service by default for more intuitive UX
});
export const configInitial = {
  url: `https://swapi.dev/api/people/1/?format=json`,
};
