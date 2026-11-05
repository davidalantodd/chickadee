// Lists eBird regions of a given type within a parent region, e.g. ?type=subnational1&parent=US
const REGION_TYPES = ['country', 'subnational1', 'subnational2']
const PARENT_CODE = /^(world|[A-Z]{2}(-[A-Z0-9]+){0,2})$/

export const handler = async (event) => {
    try {
        const { type, parent } = event.queryStringParameters

        if (!REGION_TYPES.includes(type) || !PARENT_CODE.test(parent)) {
            return {
                statusCode: 400,
                body: JSON.stringify({error: 'Invalid region type or parent code'})
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

        const response = await fetch(eBirdBaseAPIURL + `ref/region/list/${type}/${parent}`, requestOptions)
        const data = await response.json()

        return {
            statusCode: response.status,
            // Region lists rarely change: browsers cache successful responses for a day, Netlify's shared CDN cache for 7 days
            headers: response.ok ? {
                'Cache-Control': 'public, max-age=86400',
                'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=604800, stale-while-revalidate=86400',
                // Only these parameters affect the response, so ignore any others in the CDN cache key
                'Netlify-Vary': 'query=type|parent'
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
