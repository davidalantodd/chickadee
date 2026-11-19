import { licenses, images, articles, searches } from './species-images-data.js'
import { commonsThumbUrl, commonsFilePageUrl, THUMB_WIDTHS } from './wikimediaThumb.js'

// The data's own entry for a species. Codes come from URLs, and a plain lookup would find built-in object
// properties for codes like "constructor".
const entry = (table, speciesCode) => (Object.hasOwn(table, speciesCode) ? table[speciesCode] : undefined)

// Photo of a species from the bundled Wikipedia lead images, at each standard width the app uses, with the
// credit its licence requires. Null when the species has no free lead image.
export const speciesImage = (speciesCode) => {
    const record = entry(images, speciesCode)
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

// Wikipedia page for a species: its confirmed article, a search for its scientific name when none could be
// confirmed, or null when the article is simply titled with the common name (the caller links that directly)
export const wikipediaUrl = (speciesCode) => {
    const article = entry(articles, speciesCode)
    if (article) return `https://en.wikipedia.org/wiki/${encodeURIComponent(article.replace(/ /g, '_'))}`
    const search = entry(searches, speciesCode)
    if (search) return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(search)}`
    return null
}

// One-line credit for places too small for the full one, e.g. "Photo: Jane Doe / CC BY-SA 4.0"
export const photoCredit = (image) => ['Photo: ' + (image.artist ?? 'Unknown author'), image.license].filter(Boolean).join(' / ')
