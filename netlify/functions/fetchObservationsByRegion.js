// eslint-disable-next-line no-undef
exports.handler = async (event) => {
    try {
        const eBirdBaseAPIURL = 'https://api.ebird.org/v2/'
        const myHeaders = new Headers();
        
        // eslint-disable-next-line no-undef
        const eBirdApiToken = process.env.VITE_EBIRD_API_KEY
        myHeaders.append("X-eBirdApiToken", eBirdApiToken);
        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

        const {regionToSearch, notable, currentSpecies} = event.queryStringParameters

        const data = await fetch(eBirdBaseAPIURL +
            `data/obs/${regionToSearch}/recent`
            + (notable === 'true' ? '/notable' : (
                 currentSpecies !== 'undefined'  ? `/${currentSpecies}` : '')
             // eslint-disable-next-line no-undef
             ) + '?back=30'
            , requestOptions)
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