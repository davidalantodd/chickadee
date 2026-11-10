import { licenses, images } from './species-images-data.js'
import { commonsThumbUrl, commonsFilePageUrl, THUMB_WIDTHS } from './wikimediaThumb.js'

// Photo of a species from the bundled Wikipedia lead images, at each standard width the app uses, with the
// credit its licence requires. Null when the species has no free lead image.
export const speciesImage = (speciesCode) => {
    const record = images[speciesCode]
    if (!record) return null
    const [fileName, artist, licenseIndex] = record
    const [license, licenseUrl] = licenses[licenseIndex]
    return {
        urls: Object.fromEntries(Object.entries(THUMB_WIDTHS).map(([size, width]) => [size, commonsThumbUrl(fileName, width)])),
        artist,
        license,
        licenseUrl,
        filePageUrl: commonsFilePageUrl(fileName),
    }
}

// One-line credit for places too small for the full one, e.g. "Photo: Jane Doe / CC BY-SA 4.0"
export const photoCredit = (image) => ['Photo: ' + (image.artist ?? 'Unknown author'), image.license].filter(Boolean).join(' / ')
