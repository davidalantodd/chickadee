// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { badRequest, observationsResponse, parseDaysBack, prepareObservation } from './observations.js'

const ebirdObservation = (overrides = {}) => ({
    speciesCode: 'carchi',
    comName: 'Carolina Chickadee',
    locId: 'L123',
    locName: 'Pandapas Pond',
    obsDt: '2026-11-16 08:30',
    lat: 37.287654,
    lng: -80.461234,
    locationPrivate: false,
    subId: 'S200000001',
    ...overrides,
})

describe('prepareObservation', () => {
    it('leaves a public location as it is and adds its area and photo', () => {
        const prepared = prepareObservation(ebirdObservation(), 'secret')
        expect(prepared).toMatchObject({ locId: 'L123', locName: 'Pandapas Pond', lat: 37.287654, subId: 'S200000001' })
        expect(prepared.area).toBe('Blacksburg, Virginia')
        expect(prepared.photo).toEqual({
            list: expect.stringContaining('/120px-'),
            popup: expect.stringContaining('/250px-'),
            credit: 'Photo: Dan Pancamo / CC BY-SA 2.0',
        })
    })

    it('hides a private location: rounded position, generic name, no location id, opaque checklist id', () => {
        const prepared = prepareObservation(ebirdObservation({ locationPrivate: true, locName: '12 Elm St' }), 'secret')
        expect(prepared.locName).toBe('Private location')
        expect(prepared.lat).toBe(37.29)
        expect(prepared.lng).toBe(-80.46)
        expect(prepared).not.toHaveProperty('locId')
        expect(prepared.subId).toMatch(/^P[0-9a-f]{16}$/)
        expect(JSON.stringify(prepared)).not.toContain('S200000001')
        expect(JSON.stringify(prepared)).not.toContain('Elm')
    })

    it('gives a private checklist the same opaque id every time, and different ids for different checklists', () => {
        const once = prepareObservation(ebirdObservation({ locationPrivate: true }), 'secret').subId
        const again = prepareObservation(ebirdObservation({ locationPrivate: true }), 'secret').subId
        const other = prepareObservation(ebirdObservation({ locationPrivate: true, subId: 'S200000002' }), 'secret').subId
        expect(again).toBe(once)
        expect(other).not.toBe(once)
    })

    it('derives the opaque id from the secret, so it can\'t be recomputed without the API key', () => {
        const withKey = prepareObservation(ebirdObservation({ locationPrivate: true }), 'secret').subId
        const otherKey = prepareObservation(ebirdObservation({ locationPrivate: true }), 'other').subId
        expect(otherKey).not.toBe(withKey)
    })

    it('looks up a private location\'s area from its rounded position', () => {
        // Rounding moves this point from nearer one town to nearer another; the area must follow the rounded point
        const exact = prepareObservation(ebirdObservation({ lat: 37.2349, lng: -80.4149 }), 's')
        const rounded = prepareObservation(ebirdObservation({ lat: 37.2349, lng: -80.4149, locationPrivate: true }), 's')
        expect(rounded.lat).toBe(37.23)
        expect(rounded.area).toBe(prepareObservation(ebirdObservation({ lat: 37.23, lng: -80.41 }), 's').area)
        expect(exact.area).toBeTruthy()
    })

    it('gives a species with no photo a null photo', () => {
        expect(prepareObservation(ebirdObservation({ speciesCode: 'nosuchbird' }), 's').photo).toBeNull()
    })

    it('gives an observation far from any town a null area', () => {
        expect(prepareObservation(ebirdObservation({ lat: 0, lng: -140 }), 's').area).toBeNull()
    })
})

describe('parseDaysBack', () => {
    it.each([[undefined, 30], ['', 30], ['1', 1], ['3', 3], ['7', 7], ['14', 14], ['30', 30], ['7.0', 7]])(
        '%j -> %j', (value, expected) => expect(parseDaysBack(value)).toBe(expected))

    it.each(['0', '2', '31', '-7', 'abc', '7days', 'null'])('rejects %j', (value) => {
        expect(parseDaysBack(value)).toBeNull()
    })
})

describe('badRequest', () => {
    it('is a 400 with the message as JSON', () => {
        expect(badRequest('Nope')).toEqual({ statusCode: 400, body: '{"error":"Nope"}' })
    })
})

describe('observationsResponse', () => {
    beforeEach(() => { process.env.EBIRD_API_KEY = 'test-key' })
    afterEach(() => { delete process.env.EBIRD_API_KEY })

    const stubEbird = (body, status = 200) => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }))
        vi.stubGlobal('fetch', fetchMock)
        return fetchMock
    }

    it('calls eBird with the API key and prepares each observation', async () => {
        const fetchMock = stubEbird([ebirdObservation({ locationPrivate: true })])
        const response = await observationsResponse('data/obs/US-VA/recent?back=3', ['regionToSearch'])

        expect(fetchMock).toHaveBeenCalledWith('https://api.ebird.org/v2/data/obs/US-VA/recent?back=3',
            { headers: { 'X-eBirdApiToken': 'test-key' } })
        expect(response.statusCode).toBe(200)
        const [prepared] = JSON.parse(response.body)
        expect(prepared.locName).toBe('Private location')
    })

    it('caches successful responses on the CDN, varying only on the given parameters', async () => {
        stubEbird([])
        const { headers } = await observationsResponse('path', ['lat', 'lng', 'dist'])
        expect(headers['Cache-Control']).toBe('public, max-age=300')
        expect(headers['Netlify-CDN-Cache-Control']).toContain('s-maxage=1800')
        expect(headers['Netlify-Vary']).toBe('query=lat|lng|dist')
    })

    it('passes eBird errors through without caching them', async () => {
        stubEbird({ errors: [{ title: 'Bad region' }] }, 400)
        const response = await observationsResponse('path', ['x'])
        expect(response.statusCode).toBe(400)
        expect(response.headers).toEqual({})
        expect(JSON.parse(response.body)).toEqual({ errors: [{ title: 'Bad region' }] })
    })

    it('responds 500 when eBird can\'t be reached', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))
        expect(await observationsResponse('path', ['x'])).toEqual({ statusCode: 500, body: '{"error":"network down"}' })
    })

    it('responds 500 when eBird sends something other than JSON', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>oops</html>', { status: 502 })))
        expect((await observationsResponse('path', ['x'])).statusCode).toBe(500)
    })
})
