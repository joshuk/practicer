import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import anime from 'animejs'

import BaseSelect from './base/BaseSelect'
import BaseInput from './base/BaseInput'
import BeatmapSelector from './BeatmapSelector'
import DiffSetList from './DiffSetList'
import useBeatmapGenerator from '../hooks/useBeatmapGenerator'

const Container = styled.main`
  width: 100%;
  padding: 16px 0;
`

const Line = styled.p`
  width: 100%;
  font-size: 32px;
  line-height: 1.3;

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

const ButtonContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-top: 32px;
`

const CreateButton = styled.button`
  padding: 16px 24px;
  background: rgb(var(--blue-light));
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 24px;
  font-family: inherit;
  transition: background-color 0.3s;

  &[disabled] {
    background: rgb(var(--blue-light), 0.5);
  }
`

const ErrorBubble = styled.div`
  position: absolute;
  top: 50%;
  right: 0;
  width: max-content;
  padding: 12px 18px;
  background: rgb(var(--red));
  color: rgb(var(--blue-dark));
  font-weight: 500;
  transform: translate(calc(100% + 16px), -50%);
  transition: transform 0.3s, opacity 0.3s;

  :before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    display: block;
    border: 8px solid transparent;
    border-right-color: rgb(var(--red));
    transform: translate(-100%, -50%);
  }

  :empty,
  &.hidden {
    transform: translate(calc(100% + 8px), -50%);
    opacity: 0;
  }
`

export default function Form() {
  // Get a ref for the form
  const paramsRef = useRef()

  // Then create a state object for any errors
  const [error, setError] = useState('')
  const errorRef = useRef()

  // And one for the beatmap
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

  // Now import the functions from useBeatmapGenerator
  const { isBeatmapGenerating, beatmapGenerationStatus, getDownloadableBeatmap } = useBeatmapGenerator()

  // Then set up the function when the Create button is clicked
  const validateForm = async () => {
    // Check a beatmap is set
    if (!beatmap.setId) {
      setError('There is no beatmap set')

      return
    }

    // That the combo increment isn't too low
    if (Number(comboIncrement) < 10) {
      setError('The minimum combo increment is 10')

      return
    }

    // Or too high
    if (Number(comboIncrement) > beatmap.maxCombo) {
      setError('The combo increment is greater than the beatmap\'s max combo.')

      return
    }

    // Check that all the ARs are valid, then remove any duplicates
    const processedSets = []

    for (const set of diffSets) {
      if (set.ar > 10) {
        setError('The maximum AR for a difficulty is 10.')

        return
      }

      // Find any duplicate objects in the array
      const duplicateDiffSet = processedSets.find((processedSet) => {
        return JSON.stringify(processedSet) === JSON.stringify(set)
      })

      // If there isn't one, then we can add it to the processedSets list
      if (!duplicateDiffSet) {
        processedSets.push(set)
      }
    }

    // Let's hide the error here
    errorRef.current.classList.add('hidden')
    setTimeout(() => {
      setError('')
      errorRef.current.classList.remove('hidden')
    }, 300)

    const diffSetParams = {
      comboIncrement,
      incrementer,
      incrementerVolume
    }

    // Awesome, now we're ready to create the difficulties
    const { blob, filename } = await getDownloadableBeatmap(beatmap, diffSetParams, processedSets)

    // Now we've go the difficulties, we can create an invisible link to download it
    const downloadElement = document.createElement('a')
    downloadElement.style.display = 'none'
    downloadElement.setAttribute('href', URL.createObjectURL(blob))
    // TODO - Update this filename so it goes in the same folder as when you download from the osu website
    downloadElement.setAttribute('download', filename)

    // Add it to the child
    document.body.appendChild(downloadElement)

    // And click it
    downloadElement.click()
  }

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

        <ButtonContainer>
          {/* disabled={isBeatmapGenerating} */}
          <CreateButton onClick={validateForm}>{beatmapGenerationStatus ? `${beatmapGenerationStatus}...` : 'Create'}</CreateButton>

          <ErrorBubble ref={errorRef}>{error}</ErrorBubble>
        </ButtonContainer>
      </div>
    </Container>
  )
}