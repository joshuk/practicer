import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import anime from 'animejs'

import BaseSelect from './base/BaseSelect'
import BaseInput from './base/BaseInput'
import BeatmapSelector from './BeatmapSelector'
import DiffSetList from './DiffSetList'

const Container = styled.main`
  width: 100%;
  padding: 16px 0;
`

const Line = styled.p`
  width: 100%;
  font-size: 32px;
  line-height: 1.4;

  :not(:last-child) {
    margin-bottom: 16px;
  }

  @media screen and (max-width: 750px) {
    font-size: 24px;
  }
`

const BeatmapSelectionLine = styled(Line)`
  display: flex;

  @media screen and (max-width: 500px) {
    flex-wrap: wrap;

    span {
      width: 100%;
      flex: unset;
    }
  }
`

const Underline = styled.span`
  text-decoration: underline;
  text-decoration-style: dashed;
  text-decoration-color: rgb(var(--red));
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;

  @media screen and (max-width: 750px) {
    text-decoration-thickness: 1px;
    text-underline-offset: 5px;
  }
`

const CreateButton = styled.button`
  margin-top: 32px;
  padding: 16px 24px;
  background: rgb(var(--blue-light));
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 24px;
  font-family: inherit;
`

export default function Form() {
  // Get a ref for the form
  const paramsRef = useRef()

  // And the beatmap
  const [beatmap, setBeatmap] = useState()

  // Now watch for when the beatmap changes so we can animate the form
  useEffect(() => {
    if (!beatmap) {
      return
    }

    // If the object is empty, hide the form
    if (Object.keys(beatmap).length === 0) {
      if (paramsRef.current.style.height === '0px') {
        return
      }

      anime({
        targets: paramsRef.current,
        opacity: [1, 0],
        height: [paramsRef.current.scrollHeight, 0],
        duration: 500,
        easing: 'easeInOutQuad'
      })

      return
    }

    // Otherwise, show it
    const animation = anime({
      targets: paramsRef.current,
      opacity: [0, 1],
      height: [0, paramsRef.current.scrollHeight],
      duration: 500,
      easing: 'easeInOutQuad'
    })

    // Once the animation is finished, remove the style so it can expand
    animation.finished.then(() => {
      paramsRef.current.removeAttribute('style')
    })
  }, [beatmap])

  // Then increment per diff
  const [comboIncrement, setComboIncrement] = useState(200)

  // Now we can save the diff sets list
  const [diffSets, setDiffSets] = useState([])

  // And how the combo is incremented at the start
  const incrementerOptions = [
    {
      value: 'spinners'
    },
    {
      value: 'a slider'
    }
  ]
  const [incrementer, setIncrementer] = useState(incrementerOptions[0].value)
  const [incrementerVolume, setIncrementerVolume] = useState(10)

  return (
    <Container>
      <BeatmapSelectionLine>
        <span>
          From&nbsp;
        </span>
        <BeatmapSelector onBeatmapSelect={setBeatmap} />
      </BeatmapSelectionLine>

      <div ref={paramsRef} style={{height: 0, opacity: 0}}>
        <Line>
          Make me <Underline>{diffSets.length}</Underline> set{diffSets.length > 1 ? 's' : ''} of diffs every&nbsp;
          <BaseInput
            inputMode="numeric"
            defaultValue={comboIncrement}
            dynamicWidth={true}
            pattern="^[0-9]{1,3}$"
            onInputChange={setComboIncrement} /> combo:
        </Line>
        <DiffSetList beatmap={beatmap} onDiffsChange={setDiffSets} />
        <Line>
          Using&nbsp;
          <BaseSelect options={incrementerOptions} onOptionChange={setIncrementer} /> at&nbsp;
          <BaseInput
            inputMode="numeric"
            defaultValue={incrementerVolume}
            dynamicWidth={true}
            pattern="^[0-9]{1,2}$"
            onInputChange={setIncrementerVolume} />
          % volume to get the starting combo.
        </Line>

        <CreateButton>Create</CreateButton>
      </div>
    </Container>
  )
}