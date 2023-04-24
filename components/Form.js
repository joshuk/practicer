import { useState } from 'react'
import styled from 'styled-components'

import BaseSelect from './base/BaseSelect'
import BaseInput from './base/BaseInput'
import BeatmapSelector from './BeatmapSelector'
import DiffSetList from './DiffSetList'

const Line = styled.p`
  width: 100%;
  font-size: 32px;

  :not(:last-child) {
    margin-bottom: 16px;
  }

  @media screen and (max-width: 750px) {
    font-size: 24px;
  }
`

const BeatmapSelectionLine = styled(Line)`
  display: flex;
`

const Underline = styled.span`
  text-decoration: underline;
  text-decoration-style: dashed;
  text-decoration-color: rgb(var(--red));
  text-underline-offset: 6px;
  text-decoration-thickness: 2px;

  @media screen and (max-width: 750px) {
    text-decoration-thickness: 1px;
  }
`

export default function Form() {
  // Set the direction
  const directionOptions = [
    {
      value: 'start'
    },
    {
      value: 'end'
    }
  ]
  const [direction, setDirection] = useState(directionOptions[0].value)

  // And the beatmap
  const [beatmap, setBeatmap] = useState({})

  // Then increment per diff
  const [comboIncrement, setComboIncrement] = useState(200)

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
  const [incrementerVolume, setIncrementerVolume] = useState(50)

  return (
    <>
      <BeatmapSelectionLine>
        <span>
          From the&nbsp;
          <BaseSelect options={directionOptions} onOptionChange={setDirection} /> of&nbsp;
        </span>
        <BeatmapSelector onBeatmapSelect={setBeatmap} />
      </BeatmapSelectionLine>
      <Line>
        Make me <Underline>1</Underline> set of diffs every&nbsp;
        <BaseInput inputMode="numeric" defaultValue={comboIncrement} dynamicWidth={true} onInputChange={setComboIncrement} /> combo:
      </Line>
      <DiffSetList />
      <Line>
        Using&nbsp;
        <BaseSelect options={incrementerOptions} onOptionChange={setIncrementer} /> at&nbsp;
        <BaseInput inputMode="numeric" defaultValue={incrementerVolume} dynamicWidth={true} onInputChange={setIncrementerVolume} />
        % volume to get the starting combo.
      </Line>
    </>
  )
}