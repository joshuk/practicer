import styled from 'styled-components'
import { Work_Sans } from 'next/font/google'
import Head from 'next/head'

import Form from '../components/Form'

const font = Work_Sans({ subsets: ['latin'] })

const Contianer = styled.div`
  display: flex;
  width: 100%;
  max-width: var(--max-width);
  height: 100%;
  margin: 0 auto;
  padding: 0 16px;
  align-items: center;
  font-family: ${font.style.fontFamily}, sans-serif;
  flex-wrap: wrap;
`

export default function Home() {
  return (
    <>
      <Head>
        <title>Practicer - Easily create osu! practice difficulties</title>
      </Head>
      <Contianer>
        <Form />
      </Contianer>
    </>
  )
}
