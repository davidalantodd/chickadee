import { badRequest, observationsResponse, parseDaysBack } from '../lib/observations.js'

// Recent observations in an eBird region over the last `back` days (default 30): all species, notable sightings
// only, or one species
export const handler = async (event) => {
    const { regionToSearch, notable, currentSpecies, back } = event.queryStringParameters ?? {}
    const daysBack = parseDaysBack(back)

    // Only allow eBird region and species codes so the API key can't be pointed at other endpoints
    if (!/^[A-Z]{2}(-[A-Z0-9]+){0,2}$/.test(regionToSearch ?? '') ||
        (currentSpecies !== 'undefined' && !/^[a-z0-9]+$/.test(currentSpecies ?? '')) ||
        daysBack === null) {
        return badRequest('Invalid region, species code or days back')
    }

    const variant = notable === 'true' ? '/notable' : currentSpecies !== 'undefined' ? `/${currentSpecies}` : ''
    return observationsResponse(`data/obs/${regionToSearch}/recent${variant}?back=${daysBack}`, ['regionToSearch', 'notable', 'currentSpecies', 'back'])
}
