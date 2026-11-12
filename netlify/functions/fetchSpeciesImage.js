import { speciesImage, wikipediaUrl } from '../lib/speciesImages.js'

// A species' photo, credit and Wikipedia link for the observation modal, from the bundled data (no Wikipedia calls).
// Responds with { image: { urls, artist, license, licenseUrl, filePageUrl } | null, wikipediaUrl: string | null };
// a null wikipediaUrl means the article is titled with the species' common name.
export const handler = async (event) => {
    const speciesCode = event.queryStringParameters?.speciesCode

    if (!speciesCode || !/^[a-z0-9]+$/.test(speciesCode)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid species code' })
        }
    }

    return {
        statusCode: 200,
        // The data only changes with a deploy, which clears Netlify's CDN cache. Browsers keep a response for a
        // day, and the CDN cache key ignores any query parameter other than speciesCode.
        headers: {
            'Cache-Control': 'public, max-age=86400',
            'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=2592000',
            'Netlify-Vary': 'query=speciesCode'
        },
        body: JSON.stringify({ image: speciesImage(speciesCode), wikipediaUrl: wikipediaUrl(speciesCode) })
    }
}
