import { describe, expect, it } from 'vitest'
import { filtersOnly, listLink, observationLink, readNearbyFilters, readUrlFilters, readUrlObservation, withFilters,
    withNearbyFilters } from './url'
import { observation } from '../test/fixtures'

const goTo = (url) => window.history.replaceState(null, '', url)

describe('readUrlFilters', () => {
    it('defaults to the US, the list and the last 3 days', () => {
        goTo('/observations')
        expect(readUrlFilters()).toEqual({ country: 'US', region: '', subregion: '', species: '', notable: false, days: 3, view: 'list' })
    })

    it('reads every filter from an Explore link', () => {
        goTo('/observations?country=CA&region=CA-ON&subregion=CA-ON-OT&species=carchi&notable=1&days=14&view=map')
        expect(readUrlFilters()).toEqual({
            country: 'CA', region: 'CA-ON', subregion: 'CA-ON-OT', species: 'carchi', notable: true, days: 14, view: 'map',
        })
    })

    it('reads filters on an open observation\'s URL too', () => {
        goTo('/observations/S1?region=US-VA&commonName=Blue+Jay')
        expect(readUrlFilters().region).toBe('US-VA')
    })

    it('ignores Explore filters on other pages, but keeps the shared list/map view', () => {
        goTo('/nearby?region=US-VA&species=carchi&view=map')
        expect(readUrlFilters()).toMatchObject({ country: 'US', region: '', species: '', view: 'map' })
    })

    it.each([
        ['an empty country', 'country=', { country: 'US' }],
        ['notable=true (only 1 counts)', 'notable=true', { notable: false }],
        ['an unsupported days value', 'days=5', { days: 3 }],
        ['a days value that isn\'t a number', 'days=week', { days: 3 }],
        ['an unknown view', 'view=satellite', { view: 'list' }],
    ])('falls back to the default for %s', (_, query, expected) => {
        goTo(`/observations?${query}`)
        expect(readUrlFilters()).toMatchObject(expected)
    })
})

describe('withFilters', () => {
    const filters = { country: 'US', region: '', subregion: '', species: '', notable: false, days: 3, q: '', view: 'list' }

    it('leaves defaults and empty filters out of the URL', () => {
        expect(withFilters('', filters).toString()).toBe('country=US')
    })

    it('writes every set filter', () => {
        const params = withFilters('', { ...filters, region: 'US-VA', subregion: 'US-VA-121', species: 'carchi', notable: true, days: 7, q: 'jay', view: 'map' })
        expect(Object.fromEntries(params)).toEqual({
            country: 'US', region: 'US-VA', subregion: 'US-VA-121', species: 'carchi', notable: '1', days: '7', q: 'jay', view: 'map',
        })
    })

    it('removes filters that were cleared, and keeps an open observation\'s params', () => {
        const params = withFilters('?region=US-VA&days=7&notable=1&commonName=Blue+Jay', filters)
        expect(params.has('region')).toBe(false)
        expect(params.has('days')).toBe(false)
        expect(params.has('notable')).toBe(false)
        expect(params.get('commonName')).toBe('Blue Jay')
    })

    it('round-trips through readUrlFilters', () => {
        const written = { ...filters, region: 'US-VA', notable: true, days: 30, view: 'map' }
        goTo(`/observations?${withFilters('', written)}`)
        expect(readUrlFilters()).toMatchObject({ region: 'US-VA', notable: true, days: 30, view: 'map' })
    })

    it('encodes search text with special characters', () => {
        const params = withFilters('', { ...filters, q: 'jay & wren?' })
        expect(new URLSearchParams(params.toString()).get('q')).toBe('jay & wren?')
    })
})

describe('readNearbyFilters / withNearbyFilters', () => {
    it('defaults to 5 km and the last 3 days', () => {
        goTo('/nearby')
        expect(readNearbyFilters()).toEqual({ dist: 5, days: 3, species: '', notable: false, q: '' })
    })

    it('reads every filter', () => {
        goTo('/nearby?dist=25&days=14&species=carchi&notable=1&q=jay')
        expect(readNearbyFilters()).toEqual({ dist: 25, days: 14, species: 'carchi', notable: true, q: 'jay' })
    })

    it.each(['7', '0', '-5', '500', 'far', ''])('falls back to 5 km for dist=%s', (dist) => {
        goTo(`/nearby?dist=${dist}`)
        expect(readNearbyFilters().dist).toBe(5)
    })

    it('leaves defaults out of the URL and never writes a position', () => {
        const params = withNearbyFilters('?lat=1&view=map', { dist: 5, days: 3, species: '', notable: false, q: '', view: 'list' })
        expect(params.toString()).toBe('lat=1')
        const set = withNearbyFilters('', { dist: 50, days: 1, species: 'carchi', notable: true, q: 'a', view: 'map' })
        expect(Object.fromEntries(set)).toEqual({ dist: '50', days: '1', species: 'carchi', notable: '1', q: 'a', view: 'map' })
    })
})

describe('observation links', () => {
    it('opens an observation on the current page, keeping the filters', () => {
        const link = observationLink(observation(), '?region=US-VA&q=chick', '/observations')
        const url = new URL(link, 'http://localhost')
        expect(url.pathname).toBe('/observations/S100')
        expect(Object.fromEntries(url.searchParams)).toEqual({
            region: 'US-VA', q: 'chick', code: 'carchi', commonName: 'Carolina Chickadee', location: 'Pandapas Pond',
            area: 'Blacksburg, Virginia', date: '2026-11-16 08:30', lat: '37.28', lng: '-80.46',
        })
    })

    it('stays on Near me when opened from there, even from another open observation', () => {
        expect(observationLink(observation(), '', '/nearby/S999')).toMatch(/^\/nearby\/S100\?/)
    })

    it('treats the home page as Explore', () => {
        expect(observationLink(observation(), '', '/')).toMatch(/^\/observations\/S100\?/)
    })

    it('drops a previous observation\'s area when the new one has none', () => {
        const link = observationLink(observation({ area: null }), '?area=Old+Town', '/observations')
        expect(new URL(link, 'http://localhost').searchParams.has('area')).toBe(false)
    })

    it('escapes ids and names with URL characters', () => {
        const link = observationLink(observation({ subId: 'P1/2?x', locName: 'Pond & Marsh #2' }), '', '/observations')
        const url = new URL(link, 'http://localhost')
        expect(url.pathname).toBe('/observations/P1%2F2%3Fx')
        expect(url.searchParams.get('location')).toBe('Pond & Marsh #2')
    })

    it('round-trips through readUrlObservation', () => {
        const url = new URL(observationLink(observation(), '', '/observations'), 'http://localhost')
        expect(readUrlObservation('S100', url.searchParams)).toEqual({
            subId: 'S100', speciesCode: 'carchi', commonName: 'Carolina Chickadee', location: 'Pandapas Pond',
            area: 'Blacksburg, Virginia', date: '2026-11-16 08:30', lat: 37.28, lng: -80.46,
        })
    })

    it('links back to the list without the observation\'s params', () => {
        const search = '?region=US-VA&code=carchi&commonName=X&location=Y&area=Z&date=D&lat=1&lng=2&view=map'
        expect(listLink(search, '/observations/S100')).toBe('/observations?region=US-VA&view=map')
        expect(listLink('?code=carchi&commonName=X', '/nearby/S100')).toBe('/nearby')
    })

    it('filtersOnly returns an empty string when nothing is left', () => {
        expect(filtersOnly('')).toBe('')
        expect(filtersOnly('?commonName=X')).toBe('')
        expect(filtersOnly('?dist=10&lat=1')).toBe('?dist=10')
    })
})

describe('readUrlObservation', () => {
    it('is null without an id or a common name', () => {
        expect(readUrlObservation(undefined, new URLSearchParams('commonName=X'))).toBeNull()
        expect(readUrlObservation('S1', new URLSearchParams('code=carchi'))).toBeNull()
        expect(readUrlObservation('S1', new URLSearchParams('commonName='))).toBeNull()
    })

    it('fills in missing details with empty values and NaN coordinates', () => {
        expect(readUrlObservation('S1', new URLSearchParams('commonName=Blue+Jay&lat=abc'))).toEqual({
            subId: 'S1', speciesCode: null, commonName: 'Blue Jay', location: '', area: null, date: null, lat: NaN, lng: NaN,
        })
    })
})
