import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  :root {
    --max-width: 1100px;

    --gray: 221, 221, 221;
    --blue-dark: 34, 40, 49;
    --blue-light: 48, 71, 94;
    --red: 240, 84, 84;
  }

  * {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
  }

  html,
  body {
    height: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }

  body {
    background: rgb(var(--blue-dark));
    color: rgb(var(--gray));
  }

  #__next {
    height: 100%;
  }
`

export default GlobalStyle