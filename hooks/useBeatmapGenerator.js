import JSZip from 'jszip'
import { useState } from 'react'

import getDeepClone from '../helpers/getDeepClone'

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
            default:
              // I don't need to format anything else properly right now, so just add it to the output
              // with a stringValue so it can be rebuilt
              output.push({
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

  const getHitObjectsBetweenCombo = (hitObjects, startCombo, endCombo) => {
    const newHitObjects = hitObjects.filter((object) => {
      // We wanna fetch all objects that have a starting combo between the ones
      // specified. This means that if the endCombo falls inside a slider it'll
      // still be picked up.
      return object.startCombo >= startCombo && object.startCombo <= endCombo
    })

    return newHitObjects
  }

  const getComboIncrementerObjects = (incrementerType, incrementAmount, incrementVolume, firstHitObject) => {
    if (incrementAmount === 0) {
      return []
    }

    let output = null
    const incrementerTime = firstHitObject.time - 2000
    const incrementerHitsounds = `0:0:${incrementVolume}:0:`

    switch (incrementerType) {
      case 'spinners':
        // We're gonna basically make x amount of 0 length spinners, which is really easy
        // Let's just make an array with incrementAmount values, then fill them all with the same thing
        output = Array(incrementAmount).fill({
          stringValue: `256,192,${incrementerTime},44,0,${incrementerTime},${incrementerHitsounds}`
        })
      break
      case 'a slider':
        // Destructure this to make it a bit cleaner
        const { xPos, yPos } = firstHitObject

        // We're gonna make a really fast reverse slider that repeats incrementAmount - 1 times
        // An example syntax is available below
        // 154,165,55844,6,0,L|206:165,199,3,0:0:0.1:0:
        output = [{
          stringValue: `${xPos},${yPos},${incrementerTime},6,0,L|${xPos + 50}:${yPos},${incrementAmount - 1},3,${incrementerHitsounds}`
        }]
      break
    }

    return output
  }

  const getDifficultyStringFromObject = (difficultyObject, hitObjects) => {
    // So now we're gonna rebuild the difficulty file from the difficulty object and new
    // hit objects that we've generated. For safety here, let's make a deep clone
    difficultyObject = getDeepClone(difficultyObject)

    // Let's start by setting the version
    let difficulty = `${difficultyObject.header}\n`

    // Then we can delete the version, since we don't need it
    delete difficultyObject.header

    // Now we can loop through the keys of the hitObjects, since they denote the sections
    for (const [header, values] of Object.entries(difficultyObject)) {
      // So let's start by adding some new lines then the header
      difficulty += `\n${header}\n`

      if (['[Metadata]', '[Difficulty]'].includes(header)) {
        // If it's either the metadata or the difficulty sections, let's loop through and add
        // everything from the objects
        for (const [key, value] of Object.entries(values)) {
          // Ignore the stringValue keys
          if (key === 'stringValue') {
            continue
          }

          // And just reformat everything a bit
          difficulty += `${key}:${value}\n`
        }
      } else {
        // Otherwise, we can just add everything in a more generic way
        // For the items that are stored as an object they'll have a stringValue
        if (values.stringValue) {
          // This is an object, so we can just append the stringValue to the difficulty and move on
          difficulty += `${values.stringValue}\n`
        } else {
          // It's an array of values instead, so we need to loop through
          // Let's first figure out what exactly we're looping through (since we loop through something
          // different for the hit objects)
          const loopValues = header === '[HitObjects]' ? hitObjects : values
        
          // We can just loop through and add each object's stringValue along with a newLine
          loopValues.forEach((value) => {
            difficulty += `${value.stringValue}\n`
          })
        }
      }
    }

    // Now we should be done, so we can just return it
    return difficulty
  }

  const getFilenameFromString = (string) => {
    // Filenames don't allow certain special characters in them, so we're just gonna strip them out
    return string.replace(/[<>:"\/\\|?*]/g, '')
  }

  const getDownloadableBeatmap = async (beatmap, { comboIncrement, incrementer, incrementerVolume }, diffSets) => {
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
    const difficulty = beatmapFile.files[getFilenameFromString(beatmap.osuFilename)]
    const difficultyContents = await difficulty.async('string')

    // And parse it into an object
    const parsedDifficulty = getDifficultyObjectFromString(difficultyContents)

    // Then get the hitObjects, since that's the main bit we'll be editing
    const hitObjects = parsedDifficulty['[HitObjects]']

    // It should be noted here that even though we pass through the actual max combo in the
    // beatmap object, we don't necessarily want to use that due to inaccuracies in our 
    // combo calculation as we may end up missing objects at the end
    const parsedMaxCombo = hitObjects[hitObjects.length - 1].endCombo

    // Let's also figure out the original difficulty's AR. We can check the Difficulty
    // section of the file for the ApproachRate. If this isn't set (on older maps) we can grab
    // the OverallDifficulty instead
    const originalAr = parsedDifficulty['[Difficulty]'].ApproachRate || parsedDifficulty['[Difficulty]'].OverallDifficulty

    // And grab the difficulty name
    const originalDiffName = parsedDifficulty['[Metadata]'].Version

    // Then just change some variables to numbers if they aren't already
    incrementerVolume = Number(incrementerVolume)
    comboIncrement = Number(comboIncrement)

    // Now we have to go through each set, since the combo required may be different
    for (const set of diffSets) {
      // From that, we've gonna loop through each combo increment until we get to the end
      for (let i = 0; i < parsedMaxCombo; i += comboIncrement) {
        const sectionStartCombo = i
        // Then determine whether the end of the diff is at the end of the map, or the start
        // of the next difficulty
        const sectionEndCombo = set.until === 'end of the map' ? parsedMaxCombo : Math.min(parsedMaxCombo, i + comboIncrement)

        // Now we've got the combo restraints, we can get the hit objects between both of those
        const sectionHitObjects = getHitObjectsBetweenCombo(hitObjects, sectionStartCombo, sectionEndCombo)

        // Now we can generate the incrementer objects
        const incrementerObjects = getComboIncrementerObjects(incrementer, set.startingCombo, incrementerVolume, sectionHitObjects[0])

        // Right, now we've sorted that out we can get some things ready for creating the difficulty
        // Let's start off with the new diff name
        const newDiffName = `${originalDiffName} (${sectionStartCombo}-${sectionEndCombo}) (${set.startingCombo}x) ${set.ar !== originalAr ? `(AR ${set.ar})` : ''}`
        parsedDifficulty['[Metadata]'].Version = newDiffName
        parsedDifficulty['[Difficulty]'].ApproachRate = set.ar

        // Ok sick, now we've got all that we can recalculate the difficulty file
        const newDifficultyFile = getDifficultyStringFromObject(parsedDifficulty, incrementerObjects.concat(sectionHitObjects))

        // Right, now just to add it to the zip file
        // First off figure out the filename
        const fileName = getFilenameFromString(beatmap.osuFilename.replace(/\[.*\]/, `[${newDiffName.replace(/[^\w]/g, '')}]`))

        // Then chuck it in the file
        beatmapFile.file(fileName, newDifficultyFile)
      }
    }

    // We've gone through the set, added the files, now we can just generate the beatmap file's blob
    const blob = await beatmapFile.generateAsync({ type:'blob' })

    // And the osz filename
    const oszFilename = `Practicer - ${beatmap.setId} ${getFilenameFromString(beatmap.osuFilename.replace(/ (?:\([^(]*\) )?\[.*\].osu$/, ''))}.osz`

    // Update the state
    setIsBeatmapGenerating(false)
    setBeatmapGenerationStatus('')

    // And return the file
    return {
      blob,
      filename: oszFilename
    }
  }

  return {
    isBeatmapGenerating,
    beatmapGenerationStatus,
    getDownloadableBeatmap
  }
}