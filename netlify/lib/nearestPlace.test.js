// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { nearestPlace } from './nearestPlace.js'
import { places, regions, countries } from './places-data.js'

// The same distance formula as nearestPlace, checked against every town without the grid
const distanceKm = (lat1, lng1, lat2, lng2) => {
    const x = (lng2 - lng1) * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180)
    return Math.sqrt(x * x + (lat2 - lat1) ** 2) * 111.2
}
const bruteForceTown = (lat, lng) => {
    let best = null
    let bestKm = Infinity
    for (const place of places) {
        const km = distanceKm(lat, lng, place[1], place[2])
        if (km < bestKm) {
            best = place
            bestKm = km
        }
    }
    return bestKm <= 150 ? best[0] : null
}

// Repeatable pseudo-random numbers, so a failure can be reproduced
const random = (() => {
    let seed = 42
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647
})()

describe('nearestPlace', () => {
    it('names the town and state for a point in a town', () => {
        expect(nearestPlace(37.2296, -80.4139)).toBe('Blacksburg, Virginia')
    })

    it('tells apart towns with the same name by their state', () => {
        expect(nearestPlace(35.1212, -81.5159)).toBe('Blacksburg, South Carolina')
    })

    it('finds the nearest town from a point between towns', () => {
        // Between Blacksburg (37.23, -80.41) and Christiansburg (37.13, -80.41), closer to Blacksburg
        expect(nearestPlace(37.21, -80.41)).toBe('Blacksburg, Virginia')
    })

    it('works in the southern and eastern hemispheres', () => {
        expect(nearestPlace(-33.8688, 151.2093)).toMatch(/, New South Wales$/)
        expect(nearestPlace(-34.6037, -58.3816)).toMatch(/Buenos Aires/)
    })

    it('falls back to the country when the town has no known state', () => {
        const place = places.find(p => !regions[p[3]] && countries[p[3].split('.')[0]])
        expect(nearestPlace(place[1], place[2])).toBe(`${place[0]}, ${countries[place[3].split('.')[0]]}`)
    })

    it.each([
        ['missing coordinates', undefined, undefined],
        ['null coordinates', null, null],
        ['NaN', NaN, -80],
        ['infinite longitude', 37, Infinity],
        ['coordinates as strings', '37.2296', '-80.4139'],
    ])('returns null for %s', (_, lat, lng) => {
        expect(nearestPlace(lat, lng)).toBeNull()
    })

    it.each([
        ['the open ocean', 0, -140],
        ['the Gulf of Guinea at 0,0', 0, 0],
        ['the South Pole', -90, 0],
        ['the North Pole', 90, 180],
    ])('returns null in %s, far from any town', (_, lat, lng) => {
        expect(nearestPlace(lat, lng)).toBeNull()
    })

    it('matches a town just across a grid cell edge', () => {
        // Grid cells are 1° square. A town just over the line must still beat a farther one in the point's own cell.
        const town = places.find(p => p[1] - Math.floor(p[1]) < 0.01 && Math.abs(p[1]) < 60)
        const justBelow = Math.floor(town[1]) - 0.001
        expect(nearestPlace(justBelow, town[2])?.split(',')[0]).toBe(bruteForceTown(justBelow, town[2]))
    })

    it('agrees with checking every town, for 300 random points up to 65° latitude', () => {
        for (let i = 0; i < 300; i++) {
            const lat = -60 + random() * 125
            const lng = -180 + random() * 360
            expect(nearestPlace(lat, lng)?.split(',')[0] ?? null, `at ${lat}, ${lng}`).toBe(bruteForceTown(lat, lng))
        }
    })

    it('agrees with checking every town for points near towns, where the answer matters most', () => {
        for (let i = 0; i < 200; i++) {
            const place = places[Math.floor(random() * places.length)]
            const lat = place[1] + (random() - 0.5) * 0.6
            const lng = place[2] + (random() - 0.5) * 0.6
            expect(nearestPlace(lat, lng)?.split(',')[0], `near ${place[0]}`).toBe(bruteForceTown(lat, lng))
        }
    })

    it('returns null for a town just over 150 km away', () => {
        // A point 1.4° of latitude (≈156 km) south of Longyearbyen, in the Arctic Ocean
        expect(nearestPlace(78.2233 - 1.4, 15.6469)).toBeNull()
    })

    // Grid cells narrow toward the poles, so the search must go out more rings there to cover 150 km east and west
    it('finds a town 136 km east or west at 78° latitude', () => {
        expect(nearestPlace(78.2233, 15.6469 + 6)).toBe('Longyearbyen, Svalbard')
        expect(nearestPlace(78.2233, 15.6469 - 6)).toBe('Longyearbyen, Svalbard')
    })

    it('agrees with checking every town for 150 random points between 65° and 85° latitude, north and south', () => {
        for (let i = 0; i < 150; i++) {
            const lat = (65 + random() * 20) * (random() < 0.7 ? 1 : -1)
            const lng = -180 + random() * 360
            expect(nearestPlace(lat, lng)?.split(',')[0] ?? null, `at ${lat}, ${lng}`).toBe(bruteForceTown(lat, lng))
        }
    })

    it('agrees with checking every town near Arctic towns, where cells are narrowest', () => {
        const arctic = places.filter(p => p[1] > 66)
        for (let i = 0; i < 100; i++) {
            const place = arctic[Math.floor(random() * arctic.length)]
            const lat = place[1] + (random() - 0.5) * 2
            const lng = place[2] + (random() - 0.5) * 12
            expect(nearestPlace(lat, lng)?.split(',')[0] ?? null, `near ${place[0]}`).toBe(bruteForceTown(lat, lng))
        }
    })

    it('stays fast near the poles, where it searches the most cells', () => {
        const start = performance.now()
        for (let i = 0; i < 1000; i++) nearestPlace(89 - random(), -180 + random() * 360)
        expect(performance.now() - start).toBeLessThan(1000)
    })
})
