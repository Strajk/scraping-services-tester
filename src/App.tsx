import React, {useMemo, useReducer} from 'react';
import prettyBytes from 'pretty-bytes';
import fetchNoCors from "fetch-no-cors"
import dayjs from "dayjs"
import './App.css';
import {Accordion, ActionIcon, Badge, Button, Card, Checkbox, Container, Divider, Group, Stack, Table, Text, TextInput, Title} from "@mantine/core";
import {useLocalStorage} from "@mantine/hooks";
import {showNotification} from '@mantine/notifications';
import {IconEyeCheck, IconEyeOff, IconRocket} from '@tabler/icons';

import {useForm} from "@mantine/form";
import {prettyData, statusColor} from "./utils";
import {TokensImport} from "./components/TokensImport";
import {openModal} from "@mantine/modals";
import {ResultDetail} from "./components/ResultDetail";
import {About, AboutCore} from "./components/About";

const genericTokenPlaceholder = `abc123...`

interface Service {
  name: string
  desc: string
  fn: any,
  tokenLength?: number
  tokenRegex?: RegExp
  tokenHint?: string
  tokenPlaceholder?: string

}

interface Services {
  [key: string]: Service
}

const examples = [
  ['StarWars API w/o protection', 'https://swapi.dev/api/people/1/?format=json'],
  ['StockX API behind PerimeterX', 'https://stockx.com/api/products/a84b0299-c372-4828-b926-5579c076bdc6/activity?limit=10&page=1&sort=createdAt&order=DESC&state=480&currency=EUR&country=US'],
  ['Bike24 product behind Cloudflare', 'https://www.bike24.com/p2160000.html'],
]

const services: Services = {
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


type FormTokensValues = {
  [key: string]: string; // TODO: keyof services
}

type FormTogglesValues = {
  [key: string]: boolean; // TODO: keyof services
}

type FormConfigValues = {
  url: string;
}

type Result = {
  service: string;
  key: string;
  timestamp: string;
  duration: number;
  status: number;
  statusText: string;
  contentLength: number | undefined;
  headers: Record<string, string>;
  text: string | undefined;
  data: any;
}

const tokensInitial: FormTokensValues = Object.entries(services).reduce((acc, [key, value]) => {
  acc[key] = '';
  return acc;
}, {});

const togglesInitial: FormTogglesValues = Object.entries(services).reduce((acc, [key, value]) => {
  acc[key] ??= false;
  return acc;
}, {
  fetch: true, // Enable 'fetch' service by default for more intuitive UX
});

const configInitial = {
  url: `https://swapi.dev/api/people/1/?format=json`,
};

enum ActionType {
  Push = 'push',
  Clear = 'clear',
}

interface Action {
  type: ActionType;
  payload?: Result | { service: string }; // TODO: better typing based on ActionType
}

function App() {
  const [tokensInitialWithLS, setTokensToLS] = useLocalStorage({
    key: 'tokens', // local storage key
    defaultValue: tokensInitial, // this will effectively merge saved tokens with default tokens
    getInitialValueInEffect: false // https://github.com/mantinedev/mantine/issues/2266
  }); //
  const formTokens = useForm<FormTokensValues>({initialValues: tokensInitialWithLS});
  const formToggles = useForm<FormTogglesValues>({initialValues: togglesInitial});
  const formConfig = useForm<FormConfigValues>({initialValues: configInitial})
  const [ isLoading, setIsLoading ] = React.useState(false);
  const [ hideTokes, setHideTokens ] = React.useState(false); // TODO: Maybe also separate loadings for each service

  const selectedServices = useMemo(() => {
    return Object.entries(formToggles.values)
      .filter(([key, value]) => value)
      .map(([key, value]) => key);
  }, [formToggles.values]);

  /* RESULTS */
  // TODO: Refactor
  const [ results, dispatchResults ] = useReducer((state: any, action: Action) => {
    switch (action.type) {
      case ActionType.Push:
        return [...state, action.payload];
      case ActionType.Clear:
        if (action.payload) {
          return state.filter((item: Result) => item.service !== action.payload!.service);
        }
        return [];
    }
  }, [])

  // derived view for easier rendering
  type ResultsByService = {
    [key: string]: Result[];
  }
  const resultsByService: ResultsByService = useMemo(() => {
    return results.reduce((acc, result) => {
      acc[result.service] ??= [];
      acc[result.service].push(result);
      return acc;
    }, {});
  }, [results]);

  const tokensImportPrompt = () =>
    openModal({
      title: 'Import tokens',
      size: 'xl',
      children: <TokensImport
        passValues={(values) => formTokens.setValues(values)}
      />
    })

  const handleSubmit = async () => {
    const {values: valuesTokens} = formTokens;
    const {values: valuesToggles} = formToggles; // eslint-disable-line @typescript-eslint/no-unused-vars
    const {values: valuesConfig} = formConfig;
    setTokensToLS(valuesTokens); // save services to local storage, not config

    if (!selectedServices.length) {
      showNotification({
        title: 'No services selected',
        message: 'Please select at least one service',
        color: 'red',
      })
      return;
    }

    setIsLoading(true);
    Promise.allSettled(selectedServices.map(async (service) => {
      const serviceDef = services[service];
      const token = valuesTokens[service];
      if (!token && service !== 'fetch') {
        showNotification({
          title: `No token for ${serviceDef.name}`,
          message: 'Please provide a token',
          color: 'red',
        })
        return;
      }

      const timeStart = Date.now();

      const res = await serviceDef.fn(valuesConfig.url, token);

      // TODO: Handle both fetch response

      // get around `body stream already read` error
      // https://github.com/whatwg/fetch/issues/196#issuecomment-377918371
      const blob = await (res.clone()).blob();
      const data = await (res.clone()).json();
      const text = await (res.clone()).text();

      dispatchResults({
        type: ActionType.Push,
        payload: {
          service,
          key: `${service}-${timeStart}`, // TODO: Add repeats
          timestamp: new Date().toISOString(),
          duration: Date.now() - timeStart,
          status: res.status, // 200
          statusText: res.statusText, // OK
          contentLength: res.headers.get('content-length')
            ? Number(res.headers.get('content-length'))
            : blob.size,
          headers: Object.fromEntries(res.headers.entries()),
          text,
          data
        }
      });
    })).finally(() => {
      setIsLoading(false);
    })
  }

  const handleReset = () => {
    window.location.reload();
  }

  const openAbout = () => {
    openModal({
      title: 'About this project',
      size: 'xl',
      children: <About />
    })
  }

  const rows = Object.entries(services).map(([serviceId, serviceVal]) => (
    <tr key={serviceId}>
      <td>
        <Checkbox
          style={{display: 'flex'}} /* to fix vertical align */
          {...formToggles.getInputProps(serviceId)}
          checked={formToggles.values[serviceId]} /* this seems unintuitive but is needed for checkbox to work */
        />
      </td>
      <td>{serviceVal.name}</td>
      <td>
        {serviceId === 'fetch' ? <TextInput
          size="xs"
          value="Token not applicable, it's just native browse's fetch API"
          disabled
        /> : <TextInput
          size="xs"
          type={hideTokes ? 'password' : 'text'}
          placeholder={serviceVal.tokenPlaceholder}
          {...formTokens.getInputProps(serviceId)}
        />}
      </td>
    </tr>
  ));

  function clear(serviceId?: string) {
    dispatchResults({
      type: ActionType.Clear,
      payload: serviceId ? {service: serviceId} : undefined,
    })

  }

  return (
    <Container className="App">

        {/* TODO: Polish */}
        <Title order={1} mt={8}>Scraping services tester</Title>
        <Text color="dimmed" size="sm">Test various scraping/proxy services against specified URL</Text>

        <Accordion variant="contained" defaultValue="about" mt={8}>
          <Accordion.Item value="about">
            <Accordion.Control
              style={{
                paddingTop: 16 - 4,
                paddingBottom: 16 - 4,
                fontSize: 14,
              }}
            >
              <b>🥷 Why it's ok to input your precious tokens</b>
              {" "}
              <a href="#" onClick={() => openAbout()}>Read more</a>
            </Accordion.Control>
            <Accordion.Panel><AboutCore /></Accordion.Panel>
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
              <th style={{width: 1}}></th>
              <th style={{width: 1}}>Service</th>
              <th>
                <Group position="apart">
                  <span>
                    Credentials
                    {" "}
                    <a href="#" onClick={tokensImportPrompt}>Import</a>
                  </span>
                  <span>
                    <ActionIcon
                      size={20}
                      display="inline-flex"
                      style={{verticalAlign: 'text-bottom'}}
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
            {...formConfig.getInputProps('url')}
            styles={(theme) => ({
              "input" : {
                border: '2px solid #228be6'
              }
            })}
          />
          <Text lineClamp={2} size={"xs"} mt={-4}>
            <b>Try: </b>
            {examples.map(([title, url], i) => (
              <>
                <a
                  href="#"
                  style={{textDecoration: 'none'}}
                  onClick={() => formConfig.setValues({url})}
                >
                  {title}
                </a>
                {i !== examples.length - 1 ? ' • ' : ''}
              </>
            ))}
          </Text>


          {/* Actions */}
          <Group position="apart" spacing="xs" grow>
            <Button
              variant="subtle"
              color="red"
              onClick={handleReset}
            >
              Reset
            </Button>

            {/* TODO: Config */}
            {/*<Button
              variant="outline"
              color="dark"
              onClick={handleConfig}
            >
              Config
            </Button>*/}

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
          const serviceDef = services[serviceId];
          const results = resultsByService[serviceId] ?? [];
          return (
            <Card
              shadow="sm"
              p="xs"
              mt="sm"
              withBorder
              key={serviceId}
            >
              <Group position="apart">
                <Text weight={500}>{serviceDef.name}</Text>
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
                style={{whiteSpace: 'nowrap'}}
              >
                <tbody>
                {results?.length
                  ? results.map((result: any) => {
                    const timestampFormatted = dayjs(result.timestamp).format('YYYY-MM-DD HH:mm:ss');

                    return (
                      <tr
                        key={`${result.service}-${result.timestamp}`}
                        onClick={() => {
                          openModal({
                            title: `${serviceDef.name} at ${timestampFormatted}`,
                            children: <ResultDetail result={result} />,
                          })
                        }}
                      >
                        <td style={{width: 1}}>
                          {timestampFormatted}
                        </td>
                        <td style={{width: 1}}>
                          <Badge
                            color={statusColor(result.status)}
                            size="sm"
                            title={result.statusText}
                          >
                            {result.status}
                          </Badge>
                        </td>
                        <td style={{width: 120}}>
                          {result.duration} ms
                        </td>
                        <td style={{width: 120}}>
                          {result.contentLength ? prettyBytes(result.contentLength) : '-'}
                        </td>
                        <td>{prettyData(result.data)}</td>
                        <td>{Object.keys(result.headers).length} headers</td>
                      </tr>
                    );
                  })
                  : <tr>
                    <td colSpan={99}>No results yet</td>
                  </tr>}
                </tbody>
              </Table>
            </Card>
          );
        })}

        {/* Uncomment for easier development */}
        {/* <About /> */}
    </Container>
  );
}

export default App;
