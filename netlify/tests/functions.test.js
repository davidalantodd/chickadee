// @vitest-environment node
// Lives outside netlify/functions/, where Netlify deploys every file as a function
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { handler as byRegion } from '../functions/fetchObservationsByRegion.js'
import { handler as nearby } from '../functions/fetchObservationsNearby.js'
import { handler as regionsHandler } from '../functions/fetchRegions.js'
import { handler as speciesList } from '../functions/fetchSpeciesList.js'
import { handler as taxonomy } from '../functions/fetchTaxonomy.js'
import { handler as speciesImage } from '../functions/fetchSpeciesImage.js'

let fetchMock
beforeEach(() => {
    process.env.EBIRD_API_KEY = 'test-key'
    fetchMock = vi.fn(async () => new Response('[]', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { delete process.env.EBIRD_API_KEY })

const query = (params) => ({ queryStringParameters: params })
const requestedUrl = () => String(fetchMock.mock.calls[0][0])

describe('fetchObservationsByRegion', () => {
    const valid = { regionToSearch: 'US-VA', notable: 'false', currentSpecies: 'undefined', back: '3' }

    it('asks eBird for all recent observations in the region', async () => {
        const response = await byRegion(query(valid))
        expect(response.statusCode).toBe(200)
        expect(requestedUrl()).toBe('https://api.ebird.org/v2/data/obs/US-VA/recent?back=3')
        expect(response.headers['Netlify-Vary']).toBe('query=regionToSearch|notable|currentSpecies|back')
    })

    it('asks for notable sightings, which take priority over a species', async () => {
        await byRegion(query({ ...valid, notable: 'true', currentSpecies: 'carchi' }))
        expect(requestedUrl()).toBe('https://api.ebird.org/v2/data/obs/US-VA/recent/notable?back=3')
    })

    it('asks for one species', async () => {
        await byRegion(query({ ...valid, currentSpecies: 'carchi' }))
        expect(requestedUrl()).toBe('https://api.ebird.org/v2/data/obs/US-VA/recent/carchi?back=3')
    })

    it('looks back 30 days when no time is given', async () => {
        await byRegion(query({ ...valid, back: undefined }))
        expect(requestedUrl()).toContain('?back=30')
    })

    it.each(['US', 'US-VA', 'US-VA-121', 'GB-ENG-LND'])('accepts the region code %s', async (code) => {
        expect((await byRegion(query({ ...valid, regionToSearch: code }))).statusCode).toBe(200)
    })

    it.each([
        ['a lowercase region', { regionToSearch: 'us-va' }],
        ['a missing region', { regionToSearch: undefined }],
        ['a region with a path in it', { regionToSearch: 'US/../../ref/taxonomy' }],
        ['a region with too many parts', { regionToSearch: 'US-VA-121-9' }],
        ['a species code with a path in it', { currentSpecies: '../ref' }],
        ['an uppercase species code', { currentSpecies: 'CARCHI' }],
        ['an empty species code', { currentSpecies: '' }],
        ['an unsupported number of days', { back: '5' }],
    ])('rejects %s without calling eBird', async (_, params) => {
        const response = await byRegion(query({ ...valid, ...params }))
        expect(response.statusCode).toBe(400)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('rejects a request with no query string', async () => {
        expect((await byRegion({})).statusCode).toBe(400)
    })
})

describe('fetchObservationsNearby', () => {
    const valid = { lat: '37.2296', lng: '-80.4139', dist: '5', back: '3' }
    const requested = () => new URL(requestedUrl())

    it('asks eBird for observations around the point, rounded to about 1 km', async () => {
        const response = await nearby(query(valid))
        expect(response.statusCode).toBe(200)
        expect(requested().pathname).toBe('/v2/data/obs/geo/recent')
        expect(Object.fromEntries(requested().searchParams)).toEqual({ lat: '37.23', lng: '-80.41', dist: '5', back: '3' })
        expect(response.headers['Netlify-Vary']).toBe('query=lat|lng|dist|notable|species|back')
    })

    it('asks for notable sightings over a species, or one species', async () => {
        await nearby(query({ ...valid, notable: 'true', species: 'carchi' }))
        expect(requested().pathname).toBe('/v2/data/obs/geo/recent/notable')
        fetchMock.mockClear()
        await nearby(query({ ...valid, species: 'carchi' }))
        expect(requested().pathname).toBe('/v2/data/obs/geo/recent/carchi')
    })

    it.each([
        ['the poles and the antimeridian', { lat: '90', lng: '-180' }],
        ['the other pole', { lat: '-90', lng: '180' }],
        ['the largest distance', { dist: '50' }],
        ['a missing time (30 days)', { back: undefined }],
    ])('accepts %s', async (_, params) => {
        expect((await nearby(query({ ...valid, ...params }))).statusCode).toBe(200)
    })

    it.each([
        ['a latitude past the pole', { lat: '90.01' }],
        ['a longitude past the antimeridian', { lng: '-180.5' }],
        ['a missing latitude', { lat: undefined }],
        ['a latitude that isn\'t a number', { lat: 'north' }],
        ['an infinite longitude', { lng: 'Infinity' }],
        ['a distance eBird allows but the app doesn\'t offer', { dist: '7' }],
        ['a distance over eBird\'s limit', { dist: '100' }],
        ['a bad species code', { species: 'car chi' }],
        ['an unsupported number of days', { back: '60' }],
    ])('rejects %s without calling eBird', async (_, params) => {
        expect((await nearby(query({ ...valid, ...params }))).statusCode).toBe(400)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('rounds nearby visitors to the same point, so they share a cached response', async () => {
        await nearby(query({ ...valid, lat: '37.2251', lng: '-80.4149' }))
        await nearby(query({ ...valid, lat: '37.2349', lng: '-80.4051' }))
        const [first, second] = fetchMock.mock.calls.map(([url]) => String(url))
        expect(first).toBe(second)
    })
})

describe('fetchRegions', () => {
    it('lists a country\'s regions and caches them for a week on the CDN', async () => {
        const response = await regionsHandler(query({ type: 'subnational1', parent: 'US' }))
        expect(requestedUrl()).toBe('https://api.ebird.org/v2/ref/region/list/subnational1/US')
        expect(fetchMock.mock.calls[0][1].headers.get('X-eBirdApiToken')).toBe('test-key')
        expect(response.headers['Netlify-CDN-Cache-Control']).toContain('s-maxage=604800')
    })

    it('lists countries of the world', async () => {
        await regionsHandler(query({ type: 'country', parent: 'world' }))
        expect(requestedUrl()).toContain('ref/region/list/country/world')
    })

    it.each([
        [{ type: 'subnational3', parent: 'US' }],
        [{ type: 'country', parent: 'World' }],
        [{ type: 'subnational1', parent: 'US/../x' }],
    ])('rejects %j', async (params) => {
        expect((await regionsHandler(query(params))).statusCode).toBe(400)
    })

    it('responds 500 with no query string at all', async () => {
        expect((await regionsHandler({})).statusCode).toBe(500)
    })

    it('does not cache eBird errors', async () => {
        fetchMock.mockResolvedValueOnce(new Response('{"error":"x"}', { status: 503 }))
        const response = await regionsHandler(query({ type: 'country', parent: 'world' }))
        expect(response).toMatchObject({ statusCode: 503, headers: {} })
    })
})

describe('fetchSpeciesList', () => {
    it('lists the species recorded in a region', async () => {
        const response = await speciesList(query({ regionCode: 'US-VA' }))
        expect(response.statusCode).toBe(200)
        expect(requestedUrl()).toBe('https://api.ebird.org/v2/product/spplist/US-VA')
    })

    it.each([undefined, '', 'us-va', 'US-VA/../x'])('rejects the region %j', async (regionCode) => {
        expect((await speciesList(query({ regionCode }))).statusCode).toBe(400)
    })

    it('responds 500 when eBird can\'t be reached', async () => {
        fetchMock.mockRejectedValueOnce(new Error('offline'))
        expect(await speciesList(query({ regionCode: 'US' }))).toEqual({ statusCode: 500, body: '{"error":"offline"}' })
    })

    it('does not cache eBird errors', async () => {
        fetchMock.mockResolvedValueOnce(new Response('{}', { status: 403 }))
        expect(await speciesList(query({ regionCode: 'US' }))).toMatchObject({ statusCode: 403, headers: {} })
    })
})

describe('fetchTaxonomy', () => {
    it('fetches the species taxonomy, ignoring query parameters in the cache key', async () => {
        const response = await taxonomy()
        expect(requestedUrl()).toBe('https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&cat=species')
        expect(response.headers['Netlify-Vary']).toBe('query=unused')
    })

    it('responds 500 when eBird can\'t be reached, and passes errors through uncached', async () => {
        fetchMock.mockRejectedValueOnce(new Error('offline'))
        expect((await taxonomy()).statusCode).toBe(500)
        fetchMock.mockResolvedValueOnce(new Response('{}', { status: 401 }))
        expect(await taxonomy()).toMatchObject({ statusCode: 401, headers: {} })
    })
})

describe('fetchSpeciesImage', () => {
    it('returns the bundled photo and Wikipedia link without calling anything', async () => {
        const response = await speciesImage(query({ speciesCode: 'lesrhe2' }))
        expect(response.statusCode).toBe(200)
        const body = JSON.parse(response.body)
        expect(body.image.urls.modal).toContain('/960px-')
        expect(body.wikipediaUrl).toBe("https://en.wikipedia.org/wiki/Darwin's_rhea")
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('returns nulls for a species with no photo', async () => {
        expect(JSON.parse((await speciesImage(query({ speciesCode: 'nosuchbird' }))).body)).toEqual({ image: null, wikipediaUrl: null })
    })

    it('answers a code that names a built-in object property instead of crashing', async () => {
        const response = await speciesImage(query({ speciesCode: 'constructor' }))
        expect(response.statusCode).toBe(200)
        expect(JSON.parse(response.body)).toEqual({ image: null, wikipediaUrl: null })
    })

    it.each([[{}], [{ queryStringParameters: null }], [query({ speciesCode: 'Car-Chi' })]])('rejects %j', async (event) => {
        expect((await speciesImage(event)).statusCode).toBe(400)
    })
})
