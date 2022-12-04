import { Checkbox, Text, Group, MantineStyleSystemProps, TextInput, Flex, NativeSelect } from "@mantine/core"
import { Settings } from "../types"

export function ServiceSettings ({
  id,
  settingsDef = {},
  settingsForm = {},
}) {
  const sharedProps = {
    size: "xs",
  } as Partial<MantineStyleSystemProps> // TODO: Describe more

  // TODO: Nice-ify to shared props
  return (
    <Flex gap="sm">
      {
        Object.entries(settingsDef as Settings).map(([key, def]) => {
          const { type } = def
          switch (type) {
            case "text":
              return (
                <Group
                  /* TODO: Never break */
                  spacing="xs"
                  key={key}
                >
                  <Text size="xs">
                    <abbr title={def.note}>
                      {def.label}
                    </abbr>
                  </Text>
                  <TextInput
                    /* @ts-ignore YOLO */
                    {...settingsForm.getInputProps(`${id}.${key}`)}
                    {...sharedProps}
                    key={key}
                  />
                </Group>
              )
            case "boolean":
              return (
                <Checkbox
                  key={key}
                  /* @ts-ignore YOLO */
                  {...settingsForm.getInputProps(`${id}.${key}`)}
                  {...sharedProps}
                  label={<>
                    <abbr title={def.note}>
                      {def.label}
                    </abbr>
                  </>}
                  style={{ display: "flex" }} /* vertical align */
                  styles={{
                    body: { alignItems: "center" }, /* vertical align */
                    label: {
                      paddingLeft: 12 - 4,
                    },
                  }}
                />
              )
            case "select":
              return (
                <Group
                  /* TODO: Never break */
                  spacing="xs"
                  key={key}
                >
                  <Text size="xs">
                    <abbr title={def.note}>
                      {def.label}
                    </abbr>
                  </Text>
                  <NativeSelect
                    /* @ts-ignore YOLO */
                    {...settingsForm.getInputProps(`${id}.${key}`)}
                    data={def.options}
                    {...sharedProps}
                    key={key}
                  />
                </Group>
              )
            default:
              throw new Error(`Unknown type: ${type}`)
          }
        })
      }
    </Flex>
  )
}
