export function statusColor (status: number) {
  if (status >= 200 && status < 300) {
    return "teal"
  } else if (status >= 300 && status < 400) {
    return "yellow"
  } else if (status >= 400 && status < 500) {
    return "orange"
  }
  return "red"
}

export function prettyData (data) {
  return Array.isArray(data)
    ? `${data.length} items`
    : typeof data === "object"
      ? `${Object.keys(data).length} keys`
      : "unknown"
}

export function removeEmptyStringsFromObject (obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== ""),
  )
}
