import React from "react"
import { Mark, Title } from "@mantine/core"

export function AboutWhy () {
  return <>
    <p>You wanna access/scrape some website/API (hopefully, with good intentions).<br />But, <b>you got blocked</b> – either directly by the target's own anti-bot logic, or by some service they use –  Cloudflare, PerimeterX, Imperva, etc.</p>
    <p>You can either try to <b>bypass it by yourself</b> by studying various fingerprinting techniques, headers, cookies, browser quirks, proxies, etc. Or you can <b>use a service that handles that your you</b> (Or you can actually combine both approaches for the best results)</p>
    <p>This tool is for testing and comparing such services. All of them provide free trial accounts – so sign up, obtain a token, paste it to the form below, and, <b>test them all</b>!</p>
  </>
}
export function AboutSecurity () {
  return <>
    <p>You should always be <Mark><b>very cautious</b></Mark> when a website asks you for any tokens, but:</p>
    <ul>
      <li>The whole code is <b>open-source</b> on <a href="https://github.com/strajk/scraping-services-tester">GitHub</a> – you can inspect it, or run it yourself on your machine.</li>
      <li>It's a <b>static site</b> – everything is done in your browser, there's no server.</li>
      <li>There is <b>no analytics/tracking</b> – no possibility of accidentally leaking your tokens.</li>
      <li>Only the browser's <b>Local storage</b> is used for storing the configuration for convenience.</li>
      <li>It's a <b>personal project</b> solving my own problem – there's no company behind it.</li>
    </ul>
    <p><small>Some links to services are affiliate links</small></p>
  </>
}

export function About () {
  // TODO: Better implicit vertical spacing for typography
  return <>
    <AboutSecurity />

    <Title order={4} mb={4} mt={24}>Notes</Title>
    <ul>
      <li>It's a <b>personal tool, not a professional project</b> – there are no guarantees.</li>
      <li>It's <b>up to you not to do stupid stuff</b>, like trying to hack your own accounts with invalid inputs.</li>
    </ul>

    <Title order={4} mb={4} mt={24}>Credits/Acknowledgements</Title>
    <ul>
      <li><a href="https://mantine.dev/" target="_blank" rel="noreferrer">Mantine UI library</a> – for good looks</li>
      <li><a href="https://reactjs.org/" target="_blank" rel="noreferrer">React</a> – for ease of development</li>
      <li><a href="https://www.typescriptlang.org/" target="_blank" rel="noreferrer">TypeScript</a> – for catching my plethora of bugs</li>
      <li><a href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a> – for hosting the source code</li>
    </ul>
  </>
}
