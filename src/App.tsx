import React, {useMemo, useReducer} from 'react';
import prettyBytes from 'pretty-bytes';
import dayjs from "dayjs"
import logo from './logo.svg';
import './App.css';
import {Checkbox, Group, Table, TextInput, Button, Stack, Badge, Loader, Text, Card, ThemeIcon} from "@mantine/core";
import {useLocalStorage} from "@mantine/hooks";
import {showNotification} from '@mantine/notifications';

import {useForm} from "@mantine/form";

type FormServicesValues = {
  [key: string]: string | boolean;
}

type FormConfigValues = {
  repeat: number;
  url: string;
}

const services = {
  fetch: {
    name: 'Fetch',
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
    desc: '…',
    fn: async (url, token) => {

    }
  },
  zenrows: {
    name: 'ZenRows',
    desc: '…',
    fn: async (url, token) => {

    }
  },
}

const servicesInitial: FormServicesValues = Object.entries(services).reduce((acc, [key, value]) => {
  // @ts-ignore
  acc[`${key}-ENABLED`] ??= false;
  // @ts-ignore
  acc[`${key}-TOKEN`] = '';
  return acc;
}, {
  'fetch-ENABLED': true,
});
const configInitial = {
  repeat: 0,
  url: `https://swapi.dev/api/people/1/?format=json`,
};

function statusColor(status: number) {
  if (status >= 200 && status < 300) {
    return 'teal';
  } else if (status >= 300 && status < 400) {
    return 'yellow';
  } else if (status >= 400 && status < 500) {
    return 'orange';
  }
  return 'red';
}

type Result = {
  service: string;
  key: string;
  timestamp: number;
  duration: number;
  status: number;
  statusText: string;
  contentLength: number | undefined;
  headers: Record<string, string>;
  data: any;
}

function prettyData(data) {
  return Array.isArray(data)
    ? `${data.length} items`
    : typeof data === 'object'
      ? `${Object.keys(data).length} keys`
      : 'unknown'

}

function App() {

  const [value, setValueStorage] = useLocalStorage({key: 'services', defaultValue: servicesInitial});
  const formServices = useForm<FormServicesValues>({initialValues: value});
  const formConfig = useForm<FormConfigValues>({initialValues: configInitial})

  const [results, pushResult] = useReducer((state: any, action: any) => {
    return [action, ...state];
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

  const configImportPrompt = async () => {
    const input = window.prompt('Input URL with config in .env format', 'https://gist.githubusercontent.com/.../proxychet.env');
    if (!input) return;
    if (!input.startsWith('http')) {
      window.alert('Not a valid URL');
      return;
    }
    const res = await fetch(input);
    if (!res.ok) {
      window.alert('Error fetching config');
      return;
    }
    const text = await res.text();
    const lines = text.split('\n');
    const config = lines.reduce((acc, line) => {
      const [key, value] = line.split('=');
      if (!key || !value) return acc;
      acc[key + '-ENABLED'] = true;
      acc[key + '-TOKEN'] = value;
      return acc;
    }, {});
    formServices.setValues(config);
  }

  const onSubmit = async () => {
    const {values: valuesServices} = formServices;
    const {values: valuesConfig} = formConfig;
    setValueStorage(valuesServices); // save services to local storage, not config
    const selectedServices = Object.entries(services)
      .filter(([key, val]) => valuesServices[key + '-ENABLED'] === true) // TODO: Document
      .map(([key, val]) => key); // FIXME

    if (!selectedServices.length) {
      showNotification({
        title: 'No services selected',
        message: 'Please select at least one service',
        color: 'red',
      })
      return;
    }

    await Promise.all(selectedServices.map(async (service) => {
      // @ts-ignore
      const serviceDef = services[service];

      const timeStart = Date.now();

      const res = await serviceDef.fn(valuesConfig.url, valuesServices[service + '-TOKEN']);

      // TODO: Handle both fetch response

      // get around `body stream already read` error
      // https://github.com/whatwg/fetch/issues/196#issuecomment-377918371
      const blob = await (res.clone()).blob();
      const data = await (res.clone()).json();

      pushResult({
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
        data
      });
    }))
  }

  const rows = Object.entries(services).map(([serviceId, serviceVal]) => (
    <tr key={serviceId}>
      <td>
        <Checkbox
          style={{display: 'flex'}} /* to fix vertical align */
          {...formServices.getInputProps(serviceId + '-ENABLED')}
          checked={formServices.values[serviceId + '-ENABLED']} /* This seems unintuitive */
        />
      </td>
      <td>{serviceVal.name}</td>
      <td>
        <TextInput
          size="xs"
          {...formServices.getInputProps(`${serviceId}-TOKEN`)}
        />
      </td>
    </tr>
  ));

  return (
    <div className="App">
      <header className="App-header">
        {/*<img src={logo} className="App-logo" alt="logo" />*/}

        <p>

        </p>

        {/* Input */}
        <Stack
          spacing="xs"
        >

          {/* Services */}
          <Table horizontalSpacing="xs">
            <thead>
            <tr>
              <th style={{width: 1}}></th>
              <th style={{width: 1}}>Service</th>
              <th>
                Credentials
                {" "}
                <a href="#" onClick={configImportPrompt}>Import</a>
              </th>
            </tr>
            </thead>
            <tbody>{rows}</tbody>
          </Table>

          {/* Config */}
          <TextInput
            name="url"
            {...formConfig.getInputProps('url')}
          />

          {/* Actions */}
          <Group position="apart" spacing="xs" grow>
            <Button variant="outline">Reset</Button>
            <Button variant="outline">Config</Button>
            <Button variant="filled" onClick={onSubmit}>Submit</Button>
          </Group>

        </Stack>

        {/* Results */}
        {Object.entries(resultsByService).map(([serviceId, results]) => {
          const serviceDef = services[serviceId];
          return (
            <Card
              shadow="sm"
              p="xs"
              mt="sm"
              withBorder
              key={serviceId}
            >
              <Group position="apart" mt="md" mb="xs">
                <Text weight={500}>{serviceDef.name}</Text>
                {/*<Loader size="sm" />*/}
              </Group>

              <Table striped highlightOnHover withBorder style={{whiteSpace: 'nowrap'}}>
                <tbody>
                {results.map((result: any) => (
                  <tr key={`${result.service}-${result.timestamp}`}>
                    <td style={{width: 1}}>
                      {dayjs(result.timestamp).format('YYYY-MM-DD HH:mm:ss')}
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
                  </tr>
                ))}
                </tbody>
              </Table>
            </Card>

          );
        })}
      </header>
    </div>
  );
}

export default App;
