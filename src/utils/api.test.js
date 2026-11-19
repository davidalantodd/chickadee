import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCountries, fetchObservationsByRegion, fetchObservationsNearby, fetchRegionsByCountry, fetchSpeciesList,
    fetchSubRegions, fetchTaxonomy } from './api'
import { mockFetch } from '../test/fetchMock'

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })

const requested = (fetchMock) => new URL(String(fetchMock.mock.calls[0][0]), 'http://localhost')

describe('api', () => {
    it('sorts countries by name with the US first', async () => {
        mockFetch(() => [{ code: 'CA', name: 'Canada' }, { code: 'AR', name: 'Argentina' }, { code: 'US', name: 'United States' }, { code: 'AX', name: 'Åland Islands' }])
        expect((await fetchCountries()).map(c => c.code)).toEqual(['US', 'AX', 'AR', 'CA'])
    })

    it('asks for regions and sub-regions of the chosen place', async () => {
        const fetchMock = mockFetch(() => [])
        await fetchRegionsByCountry('US')
        expect(requested(fetchMock).search).toBe('?type=subnational1&parent=US')
        fetchMock.mockClear()
        await fetchSubRegions({ code: 'US-VA', name: 'Virginia' })
        expect(requested(fetchMock).search).toBe('?type=subnational2&parent=US-VA')
    })

    it('asks for observations in a region', async () => {
        const fetchMock = mockFetch(() => [{ subId: 'S1' }])
        expect(await fetchObservationsByRegion('US-VA', false, undefined, 7)).toEqual([{ subId: 'S1' }])
        expect(Object.fromEntries(requested(fetchMock).searchParams)).toEqual({
            regionToSearch: 'US-VA', notable: 'false', currentSpecies: 'undefined', back: '7',
        })
    })

    it('looks back 30 days when no time is given', async () => {
        const fetchMock = mockFetch(() => [])
        await fetchObservationsByRegion('US', true)
        expect(requested(fetchMock).searchParams.get('back')).toBe('30')
        fetchMock.mockClear()
        await fetchObservationsNearby({ lat: 1, lng: 2 }, 5)
        expect(requested(fetchMock).searchParams.get('back')).toBe('30')
    })

    it('asks for nearby observations, sending notable instead of a species when both are set', async () => {
        const fetchMock = mockFetch(() => [])
        await fetchObservationsNearby({ lat: 37.23, lng: -80.41 }, 10, true, 'carchi', 7)
        expect(Object.fromEntries(requested(fetchMock).searchParams)).toEqual({ lat: '37.23', lng: '-80.41', dist: '10', back: '7', notable: 'true' })
        fetchMock.mockClear()
        await fetchObservationsNearby({ lat: 37.23, lng: -80.41 }, 10, false, 'carchi', 7)
        expect(requested(fetchMock).searchParams.get('species')).toBe('carchi')
        expect(requested(fetchMock).searchParams.has('notable')).toBe(false)
    })

    it('encodes region codes', async () => {
        const fetchMock = mockFetch(() => [])
        await fetchSpeciesList('US VA&x=1')
        expect(requested(fetchMock).searchParams.get('regionCode')).toBe('US VA&x=1')
    })

    it('fetches the taxonomy', async () => {
        mockFetch((url) => url.endsWith('/fetchTaxonomy') ? [{ speciesCode: 'carchi' }] : undefined)
        expect(await fetchTaxonomy()).toEqual([{ speciesCode: 'carchi' }])
    })

    it.each([
        ['an error status', () => new Response('{"error":"bad"}', { status: 500 })],
        ['a network failure', () => { throw new TypeError('Failed to fetch') }],
        ['a body that isn\'t JSON', () => new Response('<html>', { status: 200 })],
    ])('resolves to an empty list on %s, and logs it', async (_, respond) => {
        mockFetch(respond)
        expect(await fetchObservationsByRegion('US', false)).toEqual([])
        expect(await fetchCountries()).toEqual([])
        expect(console.error).toHaveBeenCalled()
    })
})
