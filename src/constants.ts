import fetchNoCors from "fetch-no-cors"
import { FormSettingsValues, FormTogglesValues, FormTokensValues, Services } from "./types"
import { removeEmptyStringsFromObject } from "./utils"

const genericTokenPlaceholder = "abc123..."

export const examples = [
  ["GitHub profile (no protection)", "https://api.github.com/users/strajk"],
  ["StarWars API (no protection)", "https://swapi.dev/api/people/1/?format=json"],
  ["StockX API (PerimeterX)", "https://stockx.com/api/products/a84b0299-c372-4828-b926-5579c076bdc6/activity?limit=10&page=1&sort=createdAt&order=DESC&state=480&currency=EUR&country=US"],
  ["Bike24 product (Cloudflare)", "https://www.bike24.com/p2160000.html"],
]

export const services: Services = {
  fetch: {
    name: "Native Fetch",
    fn: (url) => {
      return fetch(url)
      // uncomment the following line to slow down the response for testing
      // .then((res) => new Promise((resolve) => setTimeout(() => resolve(res), 3000)))
    },
  },
  apify: {
    name: "Apify",
    note: `
Apify Proxy currently does not have the "API mode", it's only available as the standard proxy.
But that means it's only usable in Node.js, not in the browser.

To accommodate for that, I've deployed simple Node.js server that uses Apify Proxy and exposes it as a API endpoint accessible from the browser.

But, since this is a pet project, it's only deployed on free tier of Fly.io, so:
- it's slow – that does not mean the Apify Proxy is slow, only my server
- it might be down – it only runs until it runs out of free credits

Read more about it at <a href="https://github.com/Strajk/scraping-services-tester/tree/master/apify-proxy-aas" target="_blank">GitHub</a>
    `.trim().replace(/\n/g, "<br />"),
    link: "https://www.apify.com?fpr=1kxqp",
    dashboardLink: "https://console.apify.com/proxy#/usage",
    tokenLength: 25,
    tokenRegex: /^[a-zA-Z]{25}$/,
    tokenHint: "25 chars long, lowercase and uppercase letters",
    tokenPlaceholder: "bkNb...",
    settings: {
      groups: {
        type: "text",
        label: "Groups",
        note: "Comma-separated list of groups to use, check the Apify's dashboard for the list of available groups.",
        default: "RESIDENTIAL",
      },
    },
    fn: async (url, token) => {
      const endpoint = "https://apify-proxy-aas.fly.dev"
      // const endpoint = `http://localhost:8080` // uncomment for local testing
      return await fetch(`${endpoint}/scrape?` + new URLSearchParams({
        apiKey: token,
        targetUrl: url,
        // TODO: More params
      }))
    },
  },
  scrapingbee: {
    name: "ScrapingBee",
    link: "https://www.scrapingbee.com/", // TODO: Add affiliate, already registered
    dashboardLink: "https://app.scrapingbee.com/dashboard",
    tokenLength: 80,
    tokenRegex: /^[A-Z0-9]{80}$/,
    tokenHint: "80 chars long, uppercase letters and numbers",
    tokenPlaceholder: "IG6CGY...",
    settings: {
      premium_proxy: {
        type: "boolean",
        label: "Premium Proxy",
        note: "Premium proxy costs more credits",
        default: false,
      },
      country_code: {
        type: "select",
        label: "Country",
        note: "Requires premium proxy",
        default: "us",
        options: ["us", "fr", "de", "dk", "gr", "il", "it", "mx", "nl", "no", "ru", "es", "se", "gb"],
      },
    },
    fn: async (url, token, settings) => {
      // https://www.scrapingbee.com/documentation/
      const endpoint = "https://app.scrapingbee.com/api/v1?" + new URLSearchParams({
        api_key: token,
        url,
        ...settings,
        // stealth_proxy: 'true', // Works only with JS rendering, skip for now
      })
      console.log("🚀", endpoint)
      return fetch(endpoint)
    },
  },
  scrapingdog: {
    name: "ScrapingDog",
    link: "https://www.scrapingdog.com/?deal=pavel81",
    dashboardLink: "https://api.scrapingdog.com/dashboard",
    tokenLength: 25,
    tokenRegex: /^[a-z0-9]{25}$/,
    tokenHint: "25 chars long, lowercase letters and numbers",
    tokenPlaceholder: "s6386...",
    settings: {
      premium: {
        type: "boolean",
        label: "Premium proxy",
        note: "Premium proxy costs more credits",
        default: false, // TODO: 'yes' or 'true', string according to docs
      },
      country: {
        type: "select",
        label: "Country",
        note: "Requires premium proxy",
        default: "random",
        options: ["random", "au", "ca", "cn", "fr", "de", "in", "it", "mx", "ru", "us", "gb"],
      },
    },
    fn: async (url, token, settings) => {
      // https://www.scrapingdog.com/documentation
      return fetch("https://api.scrapingdog.com/scrape?" + new URLSearchParams({
        api_key: token,
        url,
        ...settings,
        dynamic: "false",
      }))
    },
  },
  scrapingowl: {
    name: "ScrapingOwl",
    link: "https://scrapeowl.com/", // No affiliate
    dashboardLink: "https://app.scrapeowl.com",
    tokenLength: 30,
    tokenRegex: /^[a-z0-9]{30}$/,
    tokenHint: "30 chars long, lowercase letters and numbers",
    tokenPlaceholder: "386a...",
    settings: {
      premium_proxies: {
        type: "boolean",
        label: "Premium proxies",
        note: "Premium proxies cost more credits",
        default: false,
      },
      country: {
        type: "select",
        label: "Country",
        note: "Requires premium proxy",
        default: "",
        options: ["", "us", "ca", "fr", "de", "ge", "il", "it", "mx", "nl", "ru", "es", "se", "uk"],
      },
    },
    fn: async (url, token, settings) => {
      // https://www.scrapingowl.com/documentation
      return fetch("https://api.scrapeowl.com/v1/scrape?" + new URLSearchParams({
        api_key: token,
        url,
        ...removeEmptyStringsFromObject(settings), // important not to send empty params, e.g. `&country=`
      }))
    },
  },
  scraperapi: {
    name: "ScraperAPI",
    link: "https://www.scraperapi.com/?fp_ref=pavel26",
    dashboardLink: "https://app.scraperapi.com",
    tokenPlaceholder: genericTokenPlaceholder,
    settings: {
      premium: {
        type: "boolean",
        label: "Premium proxy",
        note: "Premium proxy costs more credits",
        default: false,
      },
      ultra_premium: {
        type: "boolean",
        label: "Ultra Premium proxy",
        note: "Ultra Premium proxy costs even more credits",
        default: false,
      },
      country_code: {
        type: "select",
        label: "Country",
        note: "Requires premium proxy. Other than US, requires Business plan",
        default: "us",
        options: ["us", "ca", "uk", "de", "fr", "es", "br", "mx", "in", "jp", "cn", "au"],
      },
    },
    fn: async (url, token, settings) => {
      // https://www.scraperapi.com/documentation/
      return fetch("http://api.scraperapi.com?" + new URLSearchParams({
        api_key: token,
        url,
        ...settings,
      }))
    },
  },
  zenrows: {
    name: "ZenRows",
    link: "https://www.zenrows.com/?fpr=pavel34",
    dashboardLink: "https://app.zenrows.com/analytics",
    tokenLength: 40,
    tokenRegex: /^[a-z0-9]{40}$/,
    tokenHint: "40 chars long, lowercase letters and numbers",
    tokenPlaceholder: "739a...",
    settings: {
      premium_proxy: {
        type: "boolean",
        label: "Premium proxy",
        note: "Premium proxy costs more credits",
        default: false,
      },
      antibot: {
        type: "boolean",
        label: "Antibot",
        note: "Antibot costs more credits and requires paid plan",
        default: false,
      },
    },
    note: `
ZenRows API does not allow calling it from the browser due to CORS policy.

To accommodate this, we "fetch-no-cors" npm package, which works by proxying the request through https://cors-anywhere.herokuapp.com/corsdemo
    `.trim().replace(/\n/g, "<br />"),
    fn: async (url, token, settings) => {
      // https://www.zenrows.com/documentation#overview-node
      // https://app.zenrows.com/builder
      return fetchNoCors("https://api.zenrows.com/v1/?" + new URLSearchParams({
        apikey: token, // beware: all lowercase!
        url,
        ...settings,
      }))
    },
  },
}
export const tokensInitial: FormTokensValues = Object.entries(services).reduce((acc, [key, value]) => {
  acc[key] = ""
  return acc
}, {})
export const togglesInitial: FormTogglesValues = Object.entries(services).reduce((acc, [key, value]) => {
  acc[key] ??= false
  return acc
}, {
  fetch: true, // Enable 'fetch' service by default for more intuitive UX
})
export const configInitial = {
  url: "https://api.github.com/users/strajk",
}

export const settingsInitial: FormSettingsValues = Object.entries(services)
  .reduce((accAll, [serviceId, serviceDef]) => {
    accAll[serviceId] = Object.entries(serviceDef.settings ?? {})
      .reduce((accOne, [settingKey, settingDef]) => {
        accOne[settingKey] = settingDef.default
        return accOne
      }, {})
    return accAll
  }, {})
