import { badRequest, observationsResponse } from '../lib/observations.js'

// Recent observations (last 30 days) in an eBird region: all species, notable sightings only, or one species
export const handler = async (event) => {
    const { regionToSearch, notable, currentSpecies } = event.queryStringParameters ?? {}

    // Only allow eBird region and species codes so the API key can't be pointed at other endpoints
    if (!/^[A-Z]{2}(-[A-Z0-9]+){0,2}$/.test(regionToSearch ?? '') ||
        (currentSpecies !== 'undefined' && !/^[a-z0-9]+$/.test(currentSpecies ?? ''))) {
        return badRequest('Invalid region or species code')
    }

    const variant = notable === 'true' ? '/notable' : currentSpecies !== 'undefined' ? `/${currentSpecies}` : ''
    return observationsResponse(`data/obs/${regionToSearch}/recent${variant}?back=30`, ['regionToSearch', 'notable', 'currentSpecies'])
}
