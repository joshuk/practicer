import { useRef } from 'react'
import styled from 'styled-components'

import getTextWidth from '../../helpers/getTextWidth'

const Select = styled.select`
  background: none;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  text-decoration: underline;
  text-decoration-style: dashed;
  text-decoration-color: rgb(var(--red));
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;
  -webkit-appearance: none;
  -moz-appearance: none;

  option {
    color: rgb(var(--blue-dark));
  }

  @media screen and (max-width: 750px) {
    text-decoration-thickness: 1px;
    text-underline-offset: 5px;
  }
`

export default function BaseSelect({ options, onOptionChange }) {
  const dropdownRef = useRef()

  const setElementWidth = () => {
    // Get the value
    const value = dropdownRef.current.value

    const textWidth = getTextWidth(dropdownRef.current, value)

    // Then set the dropdown's width to the calculated one
    dropdownRef.current.style.width = `${textWidth}px`

    // Then call the event
    onOptionChange(value)
  }

  return (
    <Select ref={dropdownRef} onChange={setElementWidth}>
      {
        options.map((option, index) => {
          return <option key={index} name={option.key || option.value}>
            {option.value}
          </option>
        })
      }
    </Select>
  )
}