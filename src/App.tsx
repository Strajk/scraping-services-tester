import React, { Fragment, useMemo, useReducer } from "react"
import prettyBytes from "pretty-bytes"
import dayjs from "dayjs"
import "./App.css"
import { Accordion, ActionIcon, Badge, Button, Card, Checkbox, Container, Divider, Flex, Group, Loader, Popover, Stack, Table, Text, TextInput, Title } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import { showNotification } from "@mantine/notifications"
import { IconBrandGithub, IconExternalLink, IconEyeCheck, IconEyeOff, IconInfoCircle, IconRocket } from "@tabler/icons"

import { useForm } from "@mantine/form"
import { openModal } from "@mantine/modals"
import { prettyData, statusColor } from "./utils"
import { TokensImport } from "./components/TokensImport"
import { ResultDetail } from "./components/ResultDetail"
import { About, AboutSecurity, AboutWhy } from "./components/About"
import { configInitial, examples, services, settingsInitial, togglesInitial, tokensInitial } from "./constants"
import { Action, ActionType, FormConfigValues, FormTogglesValues, FormTokensValues, isResultError, isResultWhole, ResultCore, ResultWhole } from "./types"
import { ServiceSettings } from "./components/ServiceSettings"

function App () {
  const [tokensInitialWithLS, setTokensToLS] = useLocalStorage({
    key: "tokens", // local storage key
    defaultValue: tokensInitial, // this will effectively merge saved tokens with default tokens
    getInitialValueInEffect: false, // https://github.com/mantinedev/mantine/issues/2266
  })
  const formTokens = useForm<FormTokensValues>({ initialValues: tokensInitialWithLS })
  const formToggles = useForm<FormTogglesValues>({ initialValues: togglesInitial })
  const formConfig = useForm<FormConfigValues>({ initialValues: configInitial })
  const formSettings = useForm({ initialValues: settingsInitial }) // TODO: Local storage
  const [isLoading, setIsLoading] = React.useState(false)
  const [hideTokes, setHideTokens] = React.useState(true) // TODO: Maybe also separate loadings for each service

  const selectedServices = useMemo(() => {
    return Object.entries(formToggles.values)
      .filter(([key, value]) => value)
      .map(([key, value]) => key)
  }, [formToggles.values])

  /* RESULTS */
  // TODO: Refactor
  const [results, dispatchResults] = useReducer((state: any, action: Action) => {
    switch (action.type) {
      case ActionType.Push:
        return [...state, action.payload]
      case ActionType.Update:
        // eslint-disable-next-line no-case-declarations
        const desiredResult = state.find((result: ResultCore) => result.key === action.payload.key)
        Object.assign(desiredResult, action.payload) // mutate in place
        return [...state] // Without cloning array, React won't re-render // TODO: Solve nicer! For perf is not an issue
      case ActionType.Clear:
        if (action.payload) {
          // TODO: Investigate why `payload!` is needed, even though it's checked above
          return state.filter((item: ResultCore) => item.service !== action.payload!.service)
        }
        return []
    }
  }, [])

  // derived structure for easier rendering
  const resultsByService: { [key: string]: ResultCore[] } = useMemo(() => {
    return results.reduce((acc, result) => {
      acc[result.service] ??= []
      acc[result.service].push(result)
      return acc
    }, {})
  }, [results])

  const tokensImportPrompt = () =>
    openModal({
      title: "Import tokens",
      size: "xl",
      children: <TokensImport
        passValues={(values) => formTokens.setValues(values)}
      />,
    })

  const handleSubmit = async () => {
    const { values: valuesTokens } = formTokens
    const { values: valuesToggles } = formToggles // eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { values: valuesConfig } = formConfig
    const { values: valuesSettings } = formSettings
    setTokensToLS(valuesTokens) // save services to local storage, not config

    if (!selectedServices.length) {
      showNotification({
        title: "No services selected",
        message: "Please select at least one service",
        color: "red",
      })
      return
    }

    setIsLoading(true)
    Promise.allSettled(selectedServices.map(async (service) => {
      const serviceDef = services[service]
      const token = valuesTokens[service]

      // Handle invalid input
      if (!token && service !== "fetch") {
        showNotification({
          title: `No token for ${serviceDef.name}`,
          message: "Please provide a token",
          color: "red",
        })
        return
      }

      const timeStart = Date.now() // number of milliseconds elapsed since epoch, should be unique
      const timestamp = new Date(timeStart).toISOString()
      const key = `${service}-${timeStart}`
      const partialResult = { key, service, timestamp }
      dispatchResults({
        type: ActionType.Push,
        payload: partialResult,
      })

      // Main logic!
      const settings = valuesSettings[service] ?? {}
      const res = await serviceDef.fn(valuesConfig.url, token, settings)
        .catch((err) => {
          console.error(`???? Error while fetching ${serviceDef.name}`, err)
          dispatchResults({
            type: ActionType.Update,
            payload: {
              ...partialResult,
              duration: Date.now() - timeStart,
              error: err.message,
            },
          })
        })

      // get around `body stream already read` error
      // https://github.com/whatwg/fetch/issues/196#issuecomment-377918371
      const blob = await (res.clone()).blob()
      const data = await (res.clone()).json()
      const text = await (res.clone()).text()

      dispatchResults({
        type: ActionType.Update,
        payload: {
          ...partialResult,
          duration: Date.now() - timeStart,
          status: res.status, // 200
          statusText: res.statusText, // OK
          contentLength: res.headers.get("content-length")
            ? Number(res.headers.get("content-length"))
            : blob.size,
          headers: Object.fromEntries(res.headers.entries()),
          text,
          data,
        },
      })
    })).finally(() => {
      setIsLoading(false)
    })
  }

  const handleReset = () => {
    window.location.reload()
  }

  const openAbout = () => {
    openModal({
      title: "About this project",
      size: "xl",
      children: <About />,
    })
  }

  const rows = Object.entries(services).map(([serviceId, serviceVal]) => (
    <tr key={serviceId}>
      <td>
        <Checkbox
          style={{ display: "flex" }} /* to fix vertical align */
          {...formToggles.getInputProps(serviceId)}
          checked={formToggles.values[serviceId]} /* this seems unintuitive but is needed for checkbox to work */
        />
      </td>
      <td>
        <Flex align="center">
          {serviceVal.link
            ? <a
              href={serviceVal.link}
              target="_blank"
              rel="noreferrer"
              title={`Affiliate link to ${serviceVal.name}`}
            >{serviceVal.name}</a>
            : serviceVal.name
          }
          {serviceVal.note && (
            <Popover width="xl" position="bottom" withArrow shadow="md">
              <Popover.Target>
                <ActionIcon>
                  <IconInfoCircle size={20} />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <span dangerouslySetInnerHTML={{ __html: serviceVal.note }} />
              </Popover.Dropdown>
            </Popover>

          )}
        </Flex>
      </td>
      <td>
        <Stack spacing={4}>
          {/* Credentials */}
          <Flex>
            {serviceId === "fetch" ? <TextInput
              size="xs"
              style={{ flexGrow: 1 }}
              value="Token not applicable, it's just native browse's fetch API"
              disabled
            /> : <TextInput
              size="xs"
              style={{ flexGrow: 1 }}
              type={hideTokes ? "password" : "text"}
              placeholder={serviceVal.tokenPlaceholder}
              {...formTokens.getInputProps(serviceId)}
            />}
            <ActionIcon
              component="a"
              title="Open service dashboard"
              href={serviceVal.dashboardLink}
              target="_blank"
              rel="noreferrer"
            >
              <IconExternalLink size={18} />
            </ActionIcon>
          </Flex>
          {/* Settings */}
          <Flex
            style={{ opacity: 0.8 }} /* Poor man's visual hierarchy */
          >
            <ServiceSettings
              id={serviceId}
              settingsDef={serviceVal.settings}
              settingsForm={formSettings}
            />
          </Flex>
        </Stack>
      </td>
    </tr>
  ))

  function clear (serviceId?: string) {
    dispatchResults({
      type: ActionType.Clear,
      payload: serviceId ? { service: serviceId } : undefined,
    })
  }

  const accordionTitleStyle = {
    // tighten up
    paddingTop: 16 - 4,
    paddingBottom: 16 - 4,
    fontSize: 14,
  }

  return (
    <Container className="App">

      {/* TODO: Polish */}
      <Group position="apart" mt={8}>
        <Title order={1}>
          Scraping services tester
        </Title>
        <ActionIcon
          component="a"
          target="_blank"
          title="Open GitHub repo"
          href="https://github.com/Strajk/scraping-services-tester"
        >
          <IconBrandGithub />
        </ActionIcon>
      </Group>
      <Text color="dimmed" size="sm">Test various scraping/proxy services against specified URL</Text>

      <Accordion multiple={true} variant="contained" defaultValue={["about", "security"]} mt={8}>
        <Accordion.Item value="about">
          <Accordion.Control style={accordionTitleStyle}>
            <b>???? What is this and why does it exist?</b>
          </Accordion.Control>
          <Accordion.Panel><AboutWhy /></Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="security">
          <Accordion.Control style={accordionTitleStyle}>
            <b>???? Why it's ok to input your precious tokens</b>
            {" "}
            <a href="#" onClick={(ev) => {
              openAbout()
              ev.stopPropagation() // prevent accordion from toggling
            }}>Read more</a>
          </Accordion.Control>
          <Accordion.Panel><AboutSecurity /></Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {/* Input */}
      <Stack
        spacing="xs"
        mt={12}
      >

        {/* Services */}
        <Table horizontalSpacing="xs">
          <thead>
            <tr>
              <th style={{ width: 1 }}></th>
              <th style={{ width: 1 }}>Service</th>
              <th>
                <Group position="apart">
                  <span>
                    Credentials & settings
                    {" "}
                    <a href="#" onClick={tokensImportPrompt}>Import</a>
                  </span>
                  <span>
                    <ActionIcon
                      size={20}
                      display="inline-flex"
                      style={{ verticalAlign: "text-bottom" }}
                      onClick={() => setHideTokens(!hideTokes)}
                    >
                      {hideTokes ? <IconEyeOff size={20} /> : <IconEyeCheck size={20} />}
                    </ActionIcon>
                  </span>
                </Group>
              </th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>

        {/* Config */}
        <TextInput
          name="url"
          {...formConfig.getInputProps("url")}
          styles={(theme) => ({
            input: {
              border: "2px solid #228be6",
            },
          })}
        />
        <Text lineClamp={2} size={"xs"} mt={-4}>
          <b>Try: </b>
          {examples.map(([title, url], i) => (
            <Fragment key={title}>
              <a
                href="#"
                style={{ textDecoration: "none" }}
                onClick={(ev) => {
                  formConfig.setValues({ url })
                  ev.preventDefault() // prevent page to scroll to top
                }}
              >
                {title}
              </a>
              {i !== examples.length - 1 ? " ??? " : ""}
            </Fragment>
          ))}
        </Text>

        {/* Actions */}
        <Group position="apart" spacing="xs" grow>
          <Button
            variant="subtle"
            color="red"
            onClick={handleReset}
          >
              Reset & clear all
          </Button>

          <Button
            variant="filled"
            color="dark"
            onClick={handleSubmit}
            loading={isLoading}
            rightIcon={<IconRocket size={20} />}
          >
              Send requests
          </Button>
        </Group>
      </Stack>

      <Divider
        mt="xl"
        mb="xs"
        label="Responses"
        labelPosition="center"
      />

      {/* Results */}
      {selectedServices.map((serviceId) => {
        const serviceDef = services[serviceId]
        const results = resultsByService[serviceId] ?? []
        return (
          <Card
            shadow="sm"
            p="xs"
            mt="sm"
            withBorder
            key={serviceId}
          >
            <Group position="apart">
              <Text weight={700}>{serviceDef.name}</Text>
              <Button
                variant="subtle"
                size="xs"
                color="gray"
                onClick={() => clear(serviceId)}
              >Clear</Button>
            </Group>

            <Table
              striped highlightOnHover withBorder
              mt="xs"
              style={{ whiteSpace: "nowrap" }}
            >
              <tbody>
                {results?.length
                  ? results.map((result: ResultCore | ResultWhole) => {
                    const timestampFormatted = dayjs(result.timestamp).format("YYYY-MM-DD HH:mm:ss")

                    // TODO: Smarter type guards
                    if (!isResultWhole(result)) {
                      return <tr
                        key={`${result.service}-${result.timestamp}`}
                        // no onClick nor style until it is full result
                      >
                        <td style={{ width: 1 }}>
                          {timestampFormatted}
                        </td>
                        <td colSpan={99}>
                          <Loader size="sm" variant="dots" style={{ verticalAlign: "middle" }}/>
                        </td>
                      </tr>
                    }

                    if (isResultError(result)) {
                      return <tr
                        key={`${result.service}-${result.timestamp}`}
                        // no onClick nor style until it is full result
                      >
                        <td style={{ width: 1 }}>
                          {timestampFormatted}
                        </td>
                        <td style={{ width: 1 }}>
                          <Badge
                            color={"red"}
                            size="sm"
                            title={result.error}
                          >
                            ERR
                          </Badge>
                        </td>
                        <td><em>See console</em></td>
                        <td colSpan={99}></td>
                      </tr>
                    }

                    return (
                      <tr
                        key={`${result.service}-${result.timestamp}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          openModal({
                            title: `${serviceDef.name} at ${timestampFormatted}`,
                            children: <ResultDetail result={result} />,
                            size: "xl",
                          })
                        }}
                      >
                        <td style={{ width: 1 }}>
                          {timestampFormatted}
                        </td>
                        <td style={{ width: 1 }}>
                          <Badge
                            color={statusColor(result.status)}
                            size="sm"
                            title={result.statusText}
                          >
                            {result.status}
                          </Badge>
                        </td>
                        <td style={{ width: 120 }}>
                          {result.duration} ms
                        </td>
                        <td style={{ width: 120 }}>
                          {result.contentLength ? prettyBytes(result.contentLength) : "-"}
                        </td>
                        <td>{prettyData(result.data)}</td>
                        <td>{Object.keys(result.headers).length} headers</td>
                      </tr>
                    )
                  })
                  : <tr>
                    <td colSpan={99}>No results yet</td>
                  </tr>}
              </tbody>
            </Table>
          </Card>
        )
      })}

      {/* Uncomment for easier development */}
      {/* <About /> */}
    </Container>
  )
}

export default App
