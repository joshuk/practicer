import { useRef } from 'react'
import styled from 'styled-components'

import BaseInput from './base/BaseInput'

const List = styled.ol`
  margin-bottom: 16px;
  list-style: none;
`

const ListItem = styled.li`
  position: relative;
  margin-left: 12px;
  padding-left: 21px;
  font-size: 24px;

  input {
    text-underline-offset: 4px;
  }

  :before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    display: block;
    width: 6px;
    height: 6px;
    background: rgb(var(--red));
    border-radius: 50%;
    transform: translateY(-50%);
  }
`

export default function DiffSetList() {
  const listRef = useRef()

  const test = () => {
    console.log(listItemRef)
  }

  return (
    <>
      <List ref={listRef}>
        <ListItem>
          One set with AR
          <BaseInput inputMode="numeric" defaultValue="9" dynamicWidth={true} onInputChange={() => {}} /> and
          a starting combo of&nbsp;
          <BaseInput inputMode="numeric" defaultValue="200" dynamicWidth={true} />
        </ListItem>
      </List>
    </>
  )
}