import { badRequest, observationsResponse } from '../lib/observations.js'

// Recent observations (last 30 days) within a distance of a point: all species, notable sightings only, or one
// species. The point is rounded to 2 decimal places (about 1 km) so nobody's exact position reaches eBird, and
// so nearby visitors share cached responses.

// eBird allows up to 50 km; a fixed set keeps the number of distinct cache entries small
const DISTANCES_KM = [5, 10, 25, 50]

const round = (value) => Math.round(value * 100) / 100

export const handler = async (event) => {
    const { lat, lng, dist, notable, species } = event.queryStringParameters ?? {}
    const latitude = Number(lat)
    const longitude = Number(lng)
    const distance = Number(dist)

    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
        !DISTANCES_KM.includes(distance) ||
        (species && !/^[a-z0-9]+$/.test(species))) {
        return badRequest('Invalid location, distance or species code')
    }

    const variant = notable === 'true' ? '/notable' : species ? `/${species}` : ''
    const query = new URLSearchParams({ lat: round(latitude), lng: round(longitude), dist: distance, back: 30 })
    return observationsResponse(`data/obs/geo/recent${variant}?${query}`, ['lat', 'lng', 'dist', 'notable', 'species'])
}
