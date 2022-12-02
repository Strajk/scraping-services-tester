import React from 'react';
import {Text} from "@mantine/core";
import {Prism} from '@mantine/prism';

const sharedProps = {
  noCopy: true,
}

export function ResultDetail({result}) {
  return <>
    <Text size="xl" weight={500}>Response</Text>
    {/* TODO: plaintext lang */}
    {result.data
      ? <Prism language="json" {...sharedProps}>{JSON.stringify(result.data, null, 2)}</Prism>
      : <Prism language="markup" {...sharedProps}>{result.text}</Prism>
    }
    <Text size="xl" weight={500} mt={24}>Headers</Text>
    <Prism language="json" {...sharedProps}>{JSON.stringify(result.headers, null, 2) ?? ''}</Prism>
  </>
}
