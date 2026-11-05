/* eslint-disable no-undef */

// Looks up a species' lead image on Wikipedia, plus the author and license needed to credit it.
// Responds with { image: { src, title, artist, license, licenseUrl, filePageUrl } } or { image: null }.
const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php'

// Wikimedia asks API clients to identify themselves with a way to contact the maintainer
const requestOptions = {
    method: 'GET',
    headers: { 'User-Agent': 'chickadee-app/1.0 (https://github.com/davidalantodd/chickadee)' },
    redirect: 'follow'
}

// Images are shared by every visitor and rarely change, so the CDN caches found images for 30 days.
// Species without an image are rechecked daily in case one gets added. Browsers keep either for a day,
// and the CDN cache key ignores any query parameter other than speciesName.
const cacheHeaders = (found) => ({
    'Cache-Control': 'public, max-age=86400',
    'Netlify-CDN-Cache-Control': found
        ? 'public, durable, s-maxage=2592000, stale-while-revalidate=604800'
        : 'public, durable, s-maxage=86400',
    'Netlify-Vary': 'query=speciesName'
})

const wikipediaQuery = async (params) => {
    const query = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', ...params })
    const response = await fetch(`${WIKIPEDIA_API_URL}?${query}`, requestOptions)
    if (!response.ok) throw new Error(`Wikipedia responded with HTTP ${response.status}`)
    return response.json()
}

// Wikimedia's artist field is HTML (often a link to the photographer's profile), so reduce it to plain text
const stripHtml = (html) => html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

exports.handler = async (event) => {
    try {
        const speciesName = event.queryStringParameters?.speciesName?.trim()

        if (!speciesName || speciesName.length > 100) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid species name' })
            }
        }

        const pageData = await wikipediaQuery({
            prop: 'pageimages',
            piprop: 'original|name',
            redirects: '1',
            titles: speciesName
        })
        const page = pageData.query?.pages?.[0]

        if (!page?.original || !page.pageimage) {
            return {
                statusCode: 200,
                headers: cacheHeaders(false),
                body: JSON.stringify({ image: null })
            }
        }

        // Second lookup for the image file's author and license, which the license terms require us to display
        const fileData = await wikipediaQuery({
            prop: 'imageinfo',
            iiprop: 'extmetadata|url',
            titles: `File:${page.pageimage}`
        })
        const imageInfo = fileData.query?.pages?.[0]?.imageinfo?.[0]
        const metadata = imageInfo?.extmetadata ?? {}

        return {
            statusCode: 200,
            headers: cacheHeaders(true),
            body: JSON.stringify({
                image: {
                    src: page.original.source,
                    title: page.title,
                    artist: stripHtml(metadata.Artist?.value) || null,
                    license: metadata.LicenseShortName?.value ?? null,
                    licenseUrl: metadata.LicenseUrl?.value ?? null,
                    filePageUrl: imageInfo?.descriptionurl ?? null
                }
            })
        }

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        }
    }
}
