import { useState } from 'react'
import styled from 'styled-components'

import BaseInput from './base/BaseInput'
import Underline from './styles/Underline'

const Container = styled.span`
  position: relative;
  flex: 1;

  &[data-is-valid="true"] input {
    opacity: 0;

    :focus {
      opacity: 1;
    }

    :not(:focus) + span {
      opacity: 1;
      transform: translateY(0);
    }
  }

  input {
    width: 100%;
    transition: opacity 0.3s;
  }
`

const BeatmapName = styled(Underline)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  text-overflow: ellipsis;
  text-underline-offset: 6px;
  transform: translateY(-24px);
  transition: opacity 0.3s, transform 0.5s;
  white-space: nowrap;
`

export default function BeatmapSelector({ onBeatmapSelect }) {
  const [selectedBeatmap, setSelectedBeatmap] = useState('')

  const onBeatmapUpdate = async (value) => {
    // Gather information from the URL about the beatmap
    const beatmapRegex = /https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+#(osu|mania|fruits|taiko)\/(\d+)/g
    const beatmapRegexResult = beatmapRegex.exec(value.toLowerCase())

    // If the URL isn't valid, don't do anything
    if (!beatmapRegexResult) {
      setSelectedBeatmap('')
      onBeatmapSelect({})

      return
    }

    // If it's not an osu beatmap, don't do anything
    if (beatmapRegexResult[1] !== 'osu') {
      alert('Practicer only support osu!standard maps currently. Sorry!')

      setSelectedBeatmap('')
      onBeatmapSelect({})

      return
    }

    // Now let's try to fetch the beatmap info from our mirror
    const apiUrl = `https://api.chimu.moe/v1/map/${beatmapRegexResult[2]}`

    try {
      const beatmapRequest = await fetch(apiUrl)
      const beatmapResult = await beatmapRequest.json()

      let diffName = beatmapResult.OsuFile.replace('.osu', '')

      // Now we want to capture the mapper name and strip it out
      const artistRegex = /(\([^(]*\) )?\[.*\]$/g
      const artistRegexResult = artistRegex.exec(diffName)

      diffName = diffName.replace(artistRegexResult[1], '')

      // Then set it in state so it shows up in the component
      setSelectedBeatmap(diffName)

      // Then pass it up to the state in the form
      onBeatmapSelect({
        osuFilename: beatmapResult.OsuFile,
        beatmapId: beatmapResult.BeatmapId,
        setId: beatmapResult.ParentSetId,
        maxCombo: beatmapResult.MaxCombo,
        ar: beatmapResult.AR
      })
    } catch (e) {
      alert('There was an error fetching this beatmap from Chimu.')
      setSelectedBeatmap('')
      onBeatmapSelect({})
    }
  }

  return (
    <Container data-is-valid={selectedBeatmap !== ''}>
      <BaseInput
        placeholder="https://osu.ppy.sh/beatmapsets/874#osu/6097"
        onInputChange={onBeatmapUpdate}/>

      <BeatmapName>{selectedBeatmap}</BeatmapName>
    </Container>
  )
}