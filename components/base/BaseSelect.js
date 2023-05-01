import { useRef, useEffect } from 'react'
import styled from 'styled-components'

import Underline from '../styles/Underline'
import getTextWidth from '../../helpers/getTextWidth'

const Select = styled(Underline)`
  background: none;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
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

  // When the component mounts, set the input width
  useEffect(() => {
    // Set the width initially
    setElementWidth()

    // Then reset it when the fonts load
    document.fonts.ready.then(setElementWidth)
  }, [])

  return (
    <Select as="select" ref={dropdownRef} onChange={setElementWidth}>
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