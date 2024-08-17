// eslint-disable-next-line no-undef
exports.handler = async () => {
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

        const data = await fetch(eBirdBaseAPIURL + `ref/taxonomy/ebird?fmt=json&cat=species`, requestOptions)
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

