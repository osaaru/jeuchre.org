import { createGlobalStyle } from "styled-components"

const GlobalStyles = createGlobalStyle`
  body {
    background-color: #f8ffff;
    font-size: 16pt;
    margin: 0px;
    padding: 0px;
  }
  html {
    font-family: -apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  }
  p {
    margin-bottom: 1em;
    text-indent: 1em;
  }
`

export { GlobalStyles }
