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
  text-underline-offset: 6px;
  -webkit-appearance: none;
  -moz-appearance: none;

  option {
    color: rgb(var(--blue-dark));
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