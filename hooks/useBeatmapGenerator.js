import JSZip from 'jszip'
import { useState } from 'react'

export default function useBeatmapGenerator() {
  const [isBeatmapGenerating, setIsBeatmapGenerating] = useState(false)
  const [beatmapGenerationStatus, setBeatmapGenerationStatus] = useState('')

  const getBeatmapFromApi = async (beatmap) => {
    const oszRequest = await fetch(`https://api.chimu.moe/v1/download/${beatmap.setId}`)
    const oszFile = await oszRequest.blob()
    
    const beatmapFile = await JSZip.loadAsync(oszFile)
    
    return beatmapFile
  }

  const getActiveTimingPointAtTime = (timingPoints, time) => {
    // Let's filter out all the timing points with a time lower than the one passed in
    const pastTimingPoints = timingPoints.filter((point) => {
      return point.time <= time
    })

    // In the case that we can't find a timing point, we're gonna just use the first one
    // This is because, most likely, a note was placed a few ms before the first timing
    // point somehow
    if (!pastTimingPoints.length) {
      return timingPoints[0]
    }

    // Then return the last one
    return pastTimingPoints[pastTimingPoints.length - 1]
  }

  const getDifficultyObjectFromString = (difficulty) => {
    const sections = {
      header: difficulty.match(/osu file format v\d*/)[0]
    }

    // First we need to split everything up so we can use it
    const regex = /(\[[A-Za-z]*\])([^[]*)/gm
    let matches = null

    while ((matches = regex.exec(difficulty)) !== null) {
      if (matches.index === regex.lastIndex) {
          regex.lastIndex++
      }

      // matches will contain an array of things the regex has found
      // So we can format them a bit nicer in an object
      // Let's start by splitting up the lines (and removing the blank ones)
      const lines = matches[2].split('\r\n').filter((line) => line !== '')

      if (matches[1].match(/\[(?:General|Editor|Metadata|Difficulty|Colours)\]/)) {
        // This section is formatted like key:value, so can format it into an object
        const object = {
          // Add the string value of this section to the object by default
          stringValue: matches[2].trim()
        }

        // Split the line up to get the key and value
        lines.forEach((line) => {
          const splitLine = line.split(':')

          // If the value is a number, then add it to the object as such
          object[splitLine[0]] = splitLine[1] && !isNaN(Number(splitLine[1])) ? Number(splitLine[1]) : splitLine[1].trim()
        })

        // Then format them into an object
        sections[matches[1]] = object
      } else {
        // So this is formatted in a line by line format, so we can chuck it in an array
        // But first we wanna try to parse the lines somewhat so we know what's going on
        const output = []

        lines.forEach((line, index) => {
          const splitLine = line.split(',')
          let time = null

          switch (matches[1]) {
            case '[TimingPoints]':
              // So let's destructure everything based on the splitLine variable above
              let [
                timeValue,
                beatLength,
                beatsInMeasure,
                sampleSet,
                sampleIndex,
                volume,
                isUninherited,
                effects
              ] = splitLine

              // Now we need to do a bit of formatting so everything makes sense
              // Everything that's not formatted I don't care about rn
              time = Number(timeValue)
              beatLength = Number(beatLength)
              beatsInMeasure = Number(beatsInMeasure)
              isUninherited = Boolean(Number(isUninherited))

              // If the point is uninherited (so the beatLength is a multiplier) then we can ignore
              // anything that's postive. This happens from time to time and it just breaks stuff.
              if (!isUninherited && beatLength > 0) {
                return
              }

              // So now we need to push these to the output array in a more readable format
              output.push({
                time,
                // If this timing point is uninherited, let's take the beatLength from the previous one
                // We can then store the SV multiplier in another key, so it's a bit easier to read
                beatLength: isUninherited ? beatLength : output[index-1].beatLength,
                // Any uninherited points will use a multiplier of 1 (100%), the rest will be converted
                // from percentages by dividing by 100
                svMultiplier: isUninherited ? 1 : 1 / Math.abs(beatLength / 100),
                svPercentage: isUninherited ? 100 : beatLength,
                beatsInMeasure,
                sampleSet,
                sampleIndex,
                volume,
                isUninherited,
                effects,
                stringValue: line
              })
            break
            case '[HitObjects]':
              // So let's start by getting some basic information, since the first 4 things
              // are the same regardless of the object type
              const xPos = Number(splitLine[0])
              const yPos = Number(splitLine[1])
              time = Number(splitLine[2])

              // Now we get the objectType, that is stored as an integer but formatted as an
              // 8 bit binary number. So let's convert it, then figure out what type the object is.
              const objectTypeInt = Number(splitLine[3])
              const objectTypeBinary = objectTypeInt.toString(2).padStart(8, '0')

              // Let's default the object type to a note
              let objectType = 'circle'
              let objectCombo = 1

              // So, we've converted the integer to a binary and padded it out so it's 8 bits, which
              // leaves us with something like 00000001. If the 0th index of this is 1 it's a note,
              // 1st index is a slider, 3rd index is a spinner. However, since binary is read rtl, we
              // get the indexes by doing (length - 1) - index
              if (objectTypeBinary[6] === '1') {
                objectType = 'slider'

                // So this is a slider, let's get a slice of the splitLine variable that contains the
                // parameters for this.
                // We're only gonna get the first 3 params, since idc about hitsounds or w/e
                const [curveInfo, repeats, length] = splitLine.slice(5, 8)

                // From here we can calculate the duration of the slider
                // To do that we'll first need to get the timing point
                const currentTimingPoint = getActiveTimingPointAtTime(sections['[TimingPoints]'], time)
                const sliderMultiplier = sections['[Difficulty]'].SliderMultiplier
                const sliderTickRate = sections['[Difficulty]'].SliderTickRate

                // To calculate the duration of a slider, we can use this formula from the osu website
                // length / (SliderMultiplier * 100 * SV) * beatLength
                const sliderDuration = Math.abs(
                  Number(length) / (sliderMultiplier * 100 * currentTimingPoint.svMultiplier) * currentTimingPoint.beatLength
                )

                // So now let's figure out how often a slider tick should appear in a slider
                const sliderTickLength = currentTimingPoint.beatLength / sliderTickRate

                // Now we've got the duration, we can use it to figure out the number of ticks in the slider
                let sliderTicks = Math.floor(sliderDuration / sliderTickLength)

                // If the end of the slider falls on a beat it'll calculate there's one more tick than
                // there actually is, so we can just remove it. Because of fun floating point stuff we'll
                // just check this against a really small number, rather than 0
                if (sliderDuration % sliderTickLength < 0.0001) {
                  sliderTicks -= 1
                }

                // Now let's get the number of repeats
                const sliderRepeats = Number(repeats)

                // And multiply it by the sliderTicks, since each repeat will include the ticks
                sliderTicks *= sliderRepeats

                // Now we can add those two together to the combo, and we should be sorted
                objectCombo += sliderRepeats + sliderTicks

                // NOTE: The combo calculation here is't 100% right, it tends to overestimate in some cases.
                // But I've spent hours fucking about with it now and I'm tired of it. Will maybe come back
                // in the future and fix it. Idk (probably not).
              } else if (objectTypeBinary[4] === '1') {
                // The spinner doesn't have anything fancy right now, so we can just define
                // the object type and move on
                objectType = 'spinner'
              }

              // Now let's just figure out the start and end combo of this object
              const startCombo = index === 0 ? 0 : output[index - 1].endCombo
              const endCombo = startCombo + objectCombo

              // And now we can push everything that we've got to the output
              output.push({
                xPos,
                yPos,
                time,
                objectType,
                // We can detect whether or not this object is a new combo using the objectType string
                isNewCombo: objectTypeBinary[5] === '1' || index === 0,
                startCombo,
                endCombo,
                stringValue: line
              })
            break
          }
        })

        // Then we can push it to the sections object
        sections[matches[1]] = output
      }
    }
    
    return sections
  }

  const getBeatmapBlobUrl = async (beatmap, diffSetParams, diffSets) => {
    // Set the initial states for the UI
    setIsBeatmapGenerating(true)
    setBeatmapGenerationStatus('Fetching')

    // Fetch the .osz file from the API
    let beatmapFile = null

    try {
      beatmapFile = await getBeatmapFromApi(beatmap)
    } catch (e) {
      setIsBeatmapGenerating(false)
      setBeatmapGenerationStatus('')

      return
    }

    // We've fetched it, so update the state again
    setBeatmapGenerationStatus('Creating')

    // Then get the current difficulty from the osz file
    const difficulty = beatmapFile.files[beatmap.osuFilename]
    const difficultyContents = await difficulty.async('string')

    // And parse it into an object
    const parsedDifficulty = getDifficultyObjectFromString(difficultyContents)

    const hitObjects = parsedDifficulty['[HitObjects]']

    const circles = hitObjects.filter((object) => object.objectType === 'circle')
    const sliders = hitObjects.filter((object) => object.objectType === 'slider')
    const spinners = hitObjects.filter((object) => object.objectType === 'spinner')

    console.log('combo:', hitObjects[hitObjects.length - 1].endCombo)
    console.log('expected combo:', beatmap.maxCombo)

    console.log('circles:', circles.length)
    console.log('sliders:', sliders.length)
    console.log('spinners:', spinners.length)

    // So, from here we need to loop through all the diffSets to create what the user wants
    // for (const set of diffSets) {
    //   console.log(set)
    // }
  }

  return {
    isBeatmapGenerating,
    beatmapGenerationStatus,
    getBeatmapBlobUrl
  }
}