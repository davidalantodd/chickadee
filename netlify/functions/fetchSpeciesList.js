// Lists the codes of every species ever recorded in a region, e.g. ?regionCode=US-VT
const REGION_CODE = /^[A-Z]{2}(-[A-Z0-9]+){0,2}$/

export const handler = async (event) => {
    try {
        const regionCode = event.queryStringParameters?.regionCode

        // Only allow eBird region codes so the API key can't be pointed at other endpoints
        if (!REGION_CODE.test(regionCode ?? '')) {
            return {
                statusCode: 400,
                body: JSON.stringify({error: 'Invalid region code'})
            }
        }

        const eBirdBaseAPIURL = 'https://api.ebird.org/v2/'
        const myHeaders = new Headers();

        // eslint-disable-next-line no-undef
        const eBirdApiToken = process.env.EBIRD_API_KEY
        myHeaders.append("X-eBirdApiToken", eBirdApiToken);
        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

        const response = await fetch(eBirdBaseAPIURL + `product/spplist/${regionCode}`, requestOptions)
        const data = await response.json()

        return {
            statusCode: response.status,
            // A region's species list only grows when a new species turns up: browsers cache successful responses
            // for a day, Netlify's shared CDN cache for 7 days, and the CDN cache key ignores any other query parameters
            headers: response.ok ? {
                'Cache-Control': 'public, max-age=86400',
                'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=604800, stale-while-revalidate=86400',
                'Netlify-Vary': 'query=regionCode'
            } : {},
            body: JSON.stringify(data)
        }

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({error: err.message})
        }
    }
}
