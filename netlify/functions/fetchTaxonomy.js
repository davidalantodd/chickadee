export const handler = async () => {
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

        const response = await fetch(eBirdBaseAPIURL + `ref/taxonomy/ebird?fmt=json&cat=species`, requestOptions)
        const data = await response.json()

        return {
            statusCode: response.status,
            // The taxonomy changes about once a year: browsers keep it for a day, Netlify's shared CDN cache for 7 days.
            // This function takes no query parameters; varying on one that's never sent makes every query string
            // share a single cache entry, so junk parameters can't force fresh eBird calls.
            headers: response.ok ? {
                'Cache-Control': 'public, max-age=86400',
                'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=604800, stale-while-revalidate=86400',
                'Netlify-Vary': 'query=unused'
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

