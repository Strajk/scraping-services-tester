import React from "react"
import { Button, Textarea } from "@mantine/core"
import { closeAllModals } from "@mantine/modals"

const placeholder = `
# tokens in .env file format – one token per service per line
apify=bkNb...
scrapingbee=IG6CGY...
scrapingdog=s6386...
scrapeowl=386a...

# or URL pointing those, eg. on GitHub Gist (private!)
https://gist.githubusercontent.com/…/scraping-services-tester.env
`.trim()

// clear empty lines and comments
function clear (input: string) {
  return input.split("\n").filter(line => {
    const trimmed = line.trim()
    return trimmed.length > 0 && !trimmed.startsWith("#")
  }).join("\n")
}

export function TokensImport ({ passValues }) {
  const [input, setInput] = React.useState("")

  async function process () {
    let cleared = clear(input)
    if (!cleared) return // nothing to do
    if (cleared.startsWith("http")) {
      const res = await fetch(cleared)
      if (!res.ok) {
        window.alert("Error fetching config") // TODO: Toasts
        return
      }
      const text = await res.text()
      cleared = clear(text)
    }

    // Poor man's .env file parsing
    const lines = cleared.split("\n")
    const config = lines.reduce((acc, line) => {
      const [key, value] = line.split("=")
      if (!key || !value) return acc
      acc[key] = value
      return acc
    }, {})

    passValues(config)
    closeAllModals()
  }

  return <>
    <Textarea
      placeholder={placeholder}
      minRows={placeholder.split("\n").length + 2} /* +2 for padding */
      data-autofocus
      value={input}
      onChange={e => setInput(e.currentTarget.value)}
    />
    <Button
      onClick={process}
      mt={4}
      fullWidth
    >Import</Button>
  </>
}
