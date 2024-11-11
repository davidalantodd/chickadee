/* eslint-disable no-undef */

exports.handler = async (event) => {
    try {
        const wikipediaImgURL = 'http://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&pithumbsize=300&redirects&titles='

        const myHeaders = new Headers();
        const { speciesName } = event.queryStringParameters
        
        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'

        };

        const data = await fetch(wikipediaImgURL + speciesName, requestOptions)
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