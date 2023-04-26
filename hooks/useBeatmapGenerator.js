import JSZip from 'jszip'

export default function useBeatmapGenerator() {
  const getBeatmapBlobUrl = async (beatmap, diffSets) => {
    const oszRequest = await fetch(`https://api.chimu.moe/v1/download/${beatmap.setId}`)
    const oszFile = await oszRequest.blob()
    
    const beatmapFile = await JSZip.loadAsync(oszFile)
    const difficulty = beatmapFile.files[beatmap.osuFilename]

    const difficultyContents = await difficulty.async('string')

    console.log(difficultyContents)
  }

  return {
    getBeatmapBlobUrl
  }
}