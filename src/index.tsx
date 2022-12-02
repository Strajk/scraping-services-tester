import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { MantineProvider } from "@mantine/core"
import { NotificationsProvider } from "@mantine/notifications"
import { ModalsProvider } from "@mantine/modals"
import reportWebVitals from "./reportWebVitals"
import App from "./App"

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
)
root.render(
  <React.StrictMode>
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        // Override default theme
        spacing: { xs: 10 },
      }}
    >
      <ModalsProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
