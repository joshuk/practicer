import { useEffect, useRef, useState, useDeferredValue } from 'react'
import styled from 'styled-components'
import anime from 'animejs'

import BaseInput from './base/BaseInput'
import BaseSelect from './base/BaseSelect'
import getDeepClone from '../helpers/getDeepClone'

const List = styled.ol`
  width: 100%;
  margin-bottom: 4px;
  list-style: none;
`

const ListItem = styled.li`
  position: relative;
  margin-left: 12px;
  padding-left: 21px;
  font-size: 24px;

  input,
  select {
    text-underline-offset: 4px;
  }

  :before {
    content: '';
    position: absolute;
    top: 12px;
    left: 0;
    display: block;
    width: 6px;
    height: 6px;
    background: rgb(var(--red));
    border-radius: 50%;
  }

  @media screen and (max-width: 750px) {
    font-size: 20px;
  }
`

const ListItemInner = styled.div`
  padding-bottom: 8px;
`

const Button = styled.button`
  width: 16px;
  height: 16px;
  background: none;
  border: none;
  cursor: pointer;

  svg {
    width: 100%;
    height: 100%;
    fill: rgb(var(--red));
  }
`

const RemoveButton = styled(Button)`
  margin-left: 12px;
  transform: translateY(2px);
`

const AddButton = styled(Button)`
  width: 17px;
  height: 17px;
  margin-left: 34px;
  margin-bottom: 16px;
`

export default function DiffSetList({ beatmap, onDiffsChange }) {
  const startingComboOptions = [
    {
      value: 200
    },
    {
      value: 100
    },
    {
      value: 0
    }
  ]
  const defaultSetsList = [
    {
      id: 0,
      ar: null,
      startingCombo: 200
    }
  ]
  const [setsList, setSetsList] = useState(defaultSetsList)
  const deferredSetsList = useDeferredValue(setsList)
  const listRef = useRef()

  // When the beatmap is changed, we wanna update the setsList with the new AR
  useEffect(() => {
    if (!beatmap || !beatmap.ar) {
      return
    }

    defaultSetsList[0].ar = beatmap.ar

    setSetsList(defaultSetsList)
  }, [beatmap])

  // Whenever the setsList changes, push it up to the form
  useEffect(() => {
    // If we've added a new item, animate it in
    if (deferredSetsList.length < setsList.length) {
      const lastItem = listRef.current.querySelector('li:last-child')

      const animation = anime({
        targets: lastItem,
        height: [0, lastItem.scrollHeight],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeInOutQuad'
      })

      animation.finished.then(() => {
        lastItem.removeAttribute('style')
      })
    }

    onDiffsChange(setsList)
  }, [setsList])

  const updateSetParams = (index, param, value) => {
    const setsClone = getDeepClone(setsList)

    setsClone[index][param] = Number(value)

    setSetsList(setsClone)
  }

  const addSet = () => {
    const newSet = [
      ...setsList,
      {
        id: setsList[setsList.length - 1].id + 1,
        ar: beatmap.ar,
        startingCombo: 200
      }
    ]

    setSetsList(newSet)
  }

  const removeSet = (index) => {
    // First, let's animate the element out
    const element = listRef.current.querySelector(`li:nth-child(${index + 1})`)

    const animation = anime({
      targets: element,
      height: [element.clientHeight, 0],
      opacity: [1, 0],
      duration: 300,
      easing: 'easeInOutQuad'
    })

    animation.finished.then(() => {
      const setsClone = getDeepClone(setsList)

      setsClone.splice(index, 1)

      setSetsList(setsClone)
    })
  }

  return (
    <> 
      <List ref={listRef}>
        {setsList.map((item, index) => {
          return (
            <ListItem key={item.id}>
              <ListItemInner>
                One set with AR&nbsp;
                <BaseInput
                  inputMode="numeric"
                  defaultValue={item.ar}
                  dynamicWidth={true}
                  pattern="^[0-9]{1,2}(?:\.[0-9]?)?$"
                  onInputChange={(value) => { updateSetParams(index, 'ar', value) }} />&nbsp;and
                a starting combo of&nbsp;
                <BaseSelect options={startingComboOptions} onOptionChange={(value) => { updateSetParams(index, 'startingCombo', value) }} />
                {
                  index !== 0 ?
                  <RemoveButton onClick={() => { removeSet(index) }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"/></svg>
                  </RemoveButton>
                  : ''
                }
              </ListItemInner>
            </ListItem>
          )
        })}
      </List>

      <AddButton onClick={addSet}>
        <svg viewBox="0 0 28.572 28.572" xmlns="http://www.w3.org/2000/svg"><path d="m16.992 28.572-.074-11.684 11.654-.058v-5.228l-11.688.074L16.808 0h-5.185l.058 11.71L0 11.786v5.185l11.706-.058.058 11.66Z"/></svg>
      </AddButton>
    </>
  )
}