import { useEffect, useRef } from 'react'
import styled from 'styled-components'

import getTextWidth from '../../helpers/getTextWidth'

const Input = styled.input`
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
  -moz-appearance: textfield;

  ::placeholder {
    color: rgb(var(--blue-light));
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
      display: none;
      -webkit-appearance: none;
      margin: 0;
  }

  @media screen and (max-width: 750px) {
    text-decoration-thickness: 1px;
    text-underline-offset: 5px;
  }
`

export default function BaseInput({ inputMode, placeholder, defaultValue, dynamicWidth, pattern, allowDecimals, onInputChange }) {
  const inputRef = useRef()

  const isInputValid = (e) => {
    // Don't validate non-numeric inputs
    if (inputMode !== 'numeric') {
      return
    }

    const newValue = e.target.value + e.key
    const isKeyNumeric = new RegExp(`[0-9${allowDecimals ? '.' : ''}]`).test(e.key)
    const isDecimalValid = (!allowDecimals || /^[^.]*[.]?[^.]*$/.test(newValue))
    const isPatternValid = (!pattern || new RegExp(pattern).test(newValue))

    if (isKeyNumeric && isDecimalValid && isPatternValid) {
      return
    }

    e.preventDefault()
  }

  const onChangeHandler = (e) => {
    if (dynamicWidth) {
      setElementWidth()
    }

    onInputChange(e.target.value)
  }

  const setElementWidth = () => {
    const value = inputRef.current.value

    const textWidth = getTextWidth(inputRef.current, value)

    inputRef.current.style.maxWidth = `${textWidth}px`
  }

  // When the component mounts, set the input width
  useEffect(() => {
    if (!defaultValue) {
      return
    }

    // Set the width initially
    setElementWidth()

    // Then reset it when the fonts load
    document.fonts.ready.then(setElementWidth)
  }, [defaultValue])

  return (
    <Input
      ref={inputRef}
      inputMode={inputMode}
      placeholder={placeholder}
      defaultValue={defaultValue}
      required
      pattern={pattern}
      onChange={onChangeHandler}
      onKeyPress={isInputValid} />
  )
}
