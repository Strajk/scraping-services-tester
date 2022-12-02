import React from "react"
import { Mark, Title } from "@mantine/core"

export function AboutCore () {
  return <>
    <p>You should always be <Mark><b>very cautious</b></Mark> when website asks you any tokens, but:</p>
    <ul>
      <li>The whole code is <b>open-source</b> on <a href="https://github.com/strajk/scraping-services-tester">GitHub</a> – you can inspect it, or run it yourself on your machine.</li>
      <li>It's a <b>static site</b> – everything is done in your browser, there's no server.</li>
      <li>There is <b>no analytics/tracking</b> – no possibility of accidentally leaking your tokens.</li>
      <li>Only browser's <b>Local storage</b> is used for storing the configuration for convenience.</li>
      <li>It's a <b>personal project</b> solving my own problem – there's no evil company behind it.</li>
    </ul>
    <p><small>Some links to services are affiliate links</small></p>
  </>
}

export function About () {
  // TODO: Better implicit vertical spacing for typography
  return <>
    <AboutCore />

    <Title order={4} mb={4} mt={24}>Credits/Acknowledgements</Title>
    <ul>
      <li><a href="https://mantine.dev/" target="_blank" rel="noreferrer">Mantine UI library</a> – for good looks</li>
      <li><a href="https://reactjs.org/" target="_blank" rel="noreferrer">React</a> – for ease of development</li>
      <li><a href="https://www.typescriptlang.org/" target="_blank" rel="noreferrer">TypeScript</a> – for catching my plethora of bugs</li>
      <li><a href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a> – for hosting the source code</li>
    </ul>
  </>
}
