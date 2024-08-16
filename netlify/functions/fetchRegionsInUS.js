// eslint-disable-next-line no-undef
exports.handler = async () => {
    try {
        const eBirdBaseAPIURL = 'https://api.ebird.org/v2/'
        const myHeaders = new Headers();
        
        // eslint-disable-next-line no-undef
        myHeaders.append("X-eBirdApiToken", process.env.VITE_EBIRD_API_KEY);
        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };
        const data = await fetch(eBirdBaseAPIURL + 'ref/region/list/subnational1/US', requestOptions)
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

