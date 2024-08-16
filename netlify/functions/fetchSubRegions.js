// eslint-disable-next-line no-undef
exports.handler = async (event) => {
    try {
        const eBirdBaseAPIURL = 'https://api.ebird.org/v2/'
        const myHeaders = new Headers();
        
        // eslint-disable-next-line no-undef
        const eBirdApiToken = process.env.VITE_EBIRD_API_KEY
        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

        const { currentRegion } = event.queryStringParameters

        const data = await fetch(eBirdBaseAPIURL + `ref/region/list/subnational2/${currentRegion}&key=${eBirdApiToken}`, requestOptions)
            .then(response => response.json())

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        }

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({error: err.message})
        }
    }
}

