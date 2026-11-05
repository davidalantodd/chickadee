// eslint-disable-next-line no-undef
exports.handler = async (event) => {
    try {
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

        const {regionToSearch, notable, currentSpecies} = event.queryStringParameters

        // Only allow eBird region and species codes so the API key can't be pointed at other endpoints
        if (!/^[A-Z]{2}(-[A-Z0-9]+){0,2}$/.test(regionToSearch) ||
            (currentSpecies !== 'undefined' && !/^[a-z0-9]+$/.test(currentSpecies))) {
            return {
                statusCode: 400,
                body: JSON.stringify({error: 'Invalid region or species code'})
            }
        }

        const response = await fetch(eBirdBaseAPIURL +
            `data/obs/${regionToSearch}/recent`
            + (notable === 'true' ? '/notable' : (
                 currentSpecies !== 'undefined'  ? `/${currentSpecies}` : '')
             // eslint-disable-next-line no-undef
             ) + '?back=30'
            , requestOptions)
        const data = await response.json()
        
        return {
            statusCode: response.status,
            // Share successful responses across all visitors via Netlify's CDN for 30 minutes, then serve the
            // stale copy for up to an hour while it refreshes in the background. Errors are never cached.
            // Browsers reuse a response for 5 minutes, and the CDN cache key ignores any query parameters
            // other than these three, so junk parameters can't force fresh eBird calls.
            headers: response.ok ? {
                'Cache-Control': 'public, max-age=300',
                'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=1800, stale-while-revalidate=3600',
                'Netlify-Vary': 'query=regionToSearch|notable|currentSpecies'
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