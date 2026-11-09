import { createHmac } from 'node:crypto'
import { nearestPlace } from '../lib/nearestPlace.js'

// Personal locations (yards, home addresses) are reduced before leaving the server: coordinates are rounded
// to 2 decimal places (about 1 km) and the name is replaced. The location id is dropped and the checklist id
// swapped for an opaque one, since both lead to eBird pages showing the exact spot. The opaque id is an HMAC
// keyed with the API key, so it is stable across requests but can't be reversed by guessing checklist ids.
const obscurePrivateLocation = (observation, secret) => {
    if (!observation.locationPrivate) return observation
    // eslint-disable-next-line no-unused-vars
    const { locId, ...rest } = observation
    return {
        ...rest,
        locName: 'Private location',
        lat: Math.round(observation.lat * 100) / 100,
        lng: Math.round(observation.lng * 100) / 100,
        subId: 'P' + createHmac('sha256', secret).update(observation.subId).digest('hex').slice(0, 16),
    }
}

// Adds `area`, the nearest town and its state ("Blacksburg, Virginia"), looked up after any rounding
// so a private location's area is derived only from its approximate position
const withArea = (observation) => ({ ...observation, area: nearestPlace(observation.lat, observation.lng) })

export const handler = async (event) => {
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
        const body = Array.isArray(data) ? data.map(obs => withArea(obscurePrivateLocation(obs, eBirdApiToken))) : data
        
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
            body: JSON.stringify(body)
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({error: err.message})
        }
    }
}