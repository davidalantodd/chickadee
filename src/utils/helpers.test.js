import { describe, expect, it, vi } from 'vitest'
import { DAYS_BACK, DEFAULT_DAYS_BACK, daysLabel, daysSuffix, daysSummary, parseDaysBack } from './daysBack'
import { distanceKm, formatDistance, getRoundedPosition, locationPermission, roundCoordinate } from './geo'
import { formatDate, formatLocation } from './format'
import { stubNavigator } from '../test/navigator'

describe('daysBack', () => {
    it('offers the values eBird and the server accept, defaulting to 3', () => {
        expect(DAYS_BACK).toEqual([1, 3, 7, 14, 30])
        expect(DEFAULT_DAYS_BACK).toBe(3)
    })

    it('uses the singular for one day', () => {
        expect(daysLabel(1)).toBe('1 day')
        expect(daysLabel(7)).toBe('7 days')
        expect(daysSuffix(1)).toBe(' in the last day')
        expect(daysSuffix(30)).toBe(' in the last 30 days')
        expect(daysSummary(1)).toBe('Last day')
        expect(daysSummary(14)).toBe('Last 14 days')
    })

    it.each([['7', 7], [7, 7], ['30', 30], [null, 3], ['', 3], ['2', 3], ['31', 3], ['abc', 3], [undefined, 3]])(
        'parseDaysBack(%j) -> %j', (value, expected) => expect(parseDaysBack(value)).toBe(expected))
})

describe('geo', () => {
    it.each([[37.22961, 37.23], [-80.41449, -80.41], [-80.416, -80.42], [0.005, 0.01], [0, 0], [89.999, 90]])(
        'roundCoordinate(%j) -> %j', (value, expected) => expect(roundCoordinate(value)).toBe(expected))

    it('measures straight-line distances', () => {
        expect(distanceKm(37.23, -80.41, 37.23, -80.41)).toBe(0)
        // Blacksburg to Roanoke is about 45 km
        expect(distanceKm(37.2296, -80.4139, 37.271, -79.9414)).toBeCloseTo(42, 0)
        // A degree of latitude is about 111 km anywhere
        expect(distanceKm(0, 0, 1, 0)).toBeCloseTo(111.2, 0)
        expect(distanceKm(60, 10, 61, 10)).toBeCloseTo(111.2, 0)
    })

    it('measures across the antimeridian and between the poles', () => {
        expect(distanceKm(0, 179.9, 0, -179.9)).toBeCloseTo(22.2, 0)
        expect(distanceKm(90, 0, -90, 0)).toBeCloseTo(20015, -1)
    })

    it.each([
        [0, '100 m away'],
        [0.04, '100 m away'],
        [0.26, '300 m away'],
        [0.9, '900 m away'],
        [1, '1.0 km away'],
        [3.24, '3.2 km away'],
        [10, '10 km away'],
        [18.6, '19 km away'],
    ])('formatDistance(%j) -> %s', (km, expected) => expect(formatDistance(km)).toBe(expected))

    // Edge cases where rounding crosses a unit boundary
    it('shows "1000 m" just under 1 km and "10.0 km" just under 10 km', () => {
        expect(formatDistance(0.96)).toBe('1000 m away')
        expect(formatDistance(9.97)).toBe('10.0 km away')
    })

    it('rounds the browser\'s position before resolving it', async () => {
        const getCurrentPosition = vi.fn((success) => success({ coords: { latitude: 37.229612, longitude: -80.413912 } }))
        stubNavigator({ geolocation: { getCurrentPosition } })
        await expect(getRoundedPosition()).resolves.toEqual({ lat: 37.23, lng: -80.41 })
        expect(getCurrentPosition.mock.calls[0][2]).toMatchObject({ enableHighAccuracy: false, maximumAge: 600000 })
    })

    it('rejects with the browser\'s error', async () => {
        const error = { code: 1, message: 'User denied' }
        stubNavigator({ geolocation: { getCurrentPosition: (_, fail) => fail(error) } })
        await expect(getRoundedPosition()).rejects.toBe(error)
    })

    it('reports the location permission, or unknown when the browser can\'t say', async () => {
        stubNavigator({ permissions: { query: async () => ({ state: 'granted' }) } })
        expect(await locationPermission()).toBe('granted')
        stubNavigator({ permissions: { query: async () => { throw new TypeError('unsupported') } } })
        expect(await locationPermission()).toBe('unknown')
        stubNavigator({ permissions: undefined })
        expect(await locationPermission()).toBe('unknown')
    })
})

describe('format', () => {
    it('formats eBird dates in US English', () => {
        expect(formatDate('2026-11-16 08:30')).toBe('Mon, Nov 16, 2026, 8:30 AM')
        expect(formatDate('2026-01-01 17:05')).toBe('Thu, Jan 1, 2026, 5:05 PM')
    })

    it('throws on a date it can\'t read, so callers must check first', () => {
        expect(() => formatDate('not a date')).toThrow(RangeError)
    })

    it('shortens location names over 70 characters', () => {
        expect(formatLocation('a'.repeat(70))).toBe('a'.repeat(70))
        expect(formatLocation('a'.repeat(71))).toBe('a'.repeat(70) + '...')
        expect(formatLocation('')).toBe('')
    })
})
