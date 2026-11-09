import { regions, countries, places } from './places-data.js'

// Nearest-town lookup over the bundled GeoNames list (towns of 1,000+ people), with no network calls.
//
// Towns are bucketed into 1°×1° grid cells. A lookup scans rings of cells outward from the point's cell
// and stops once the next ring can't hold anything closer than the best match so far.

const KM_PER_DEGREE = 111.2
// Towns further than this aren't a useful label (e.g. offshore). The ring limit covers this distance
// up to about 70° latitude, where cells are narrowest.
const MAX_DISTANCE_KM = 150
const MAX_RINGS = 5

const cellKey = (latCell, lngCell) => `${latCell},${lngCell}`

const grid = new Map()
for (const place of places) {
    const key = cellKey(Math.floor(place[1]), Math.floor(place[2]))
    if (!grid.has(key)) grid.set(key, [])
    grid.get(key).push(place)
}

// Equirectangular approximation: accurate enough to rank towns within a few hundred km
const distanceKm = (lat1, lng1, lat2, lng2) => {
    const x = (lng2 - lng1) * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180)
    const y = lat2 - lat1
    return Math.sqrt(x * x + y * y) * KM_PER_DEGREE
}

// Cells in the square ring at distance `ring` around (latCell, lngCell)
function* ringCells(latCell, lngCell, ring) {
    for (let dLat = -ring; dLat <= ring; dLat++) {
        for (let dLng = -ring; dLng <= ring; dLng++) {
            if (Math.max(Math.abs(dLat), Math.abs(dLng)) === ring) yield cellKey(latCell + dLat, lngCell + dLng)
        }
    }
}

// "Town, State" (or "Town, Country" when the state is unknown) for the town nearest to the point,
// or null when the coordinates are missing or no town is within MAX_DISTANCE_KM
export const nearestPlace = (lat, lng) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    const latCell = Math.floor(lat)
    const lngCell = Math.floor(lng)
    // Narrowest cell width near this latitude; a cell `ring` rings out is at least (ring - 1) widths away
    const cellWidthKm = KM_PER_DEGREE * Math.max(Math.cos((Math.abs(lat) + 1) * Math.PI / 180), 0.05)

    let best = null
    let bestKm = Infinity
    for (let ring = 0; ring <= MAX_RINGS; ring++) {
        if (best && (ring - 1) * cellWidthKm > bestKm) break
        for (const key of ringCells(latCell, lngCell, ring)) {
            for (const place of grid.get(key) ?? []) {
                const km = distanceKm(lat, lng, place[1], place[2])
                if (km < bestKm) {
                    best = place
                    bestKm = km
                }
            }
        }
    }
    if (!best || bestKm > MAX_DISTANCE_KM) return null

    const [town, , , regionKey] = best
    const area = regions[regionKey] ?? countries[regionKey.split('.')[0]]
    return area ? `${town}, ${area}` : town
}
