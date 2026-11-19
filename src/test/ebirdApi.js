import { waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import { callsTo, mockFetch } from './fetchMock'
import { countries, observations, regions, subRegions, taxonomy } from './fixtures'

// Stands in for the Netlify functions with the fixture data. `byRegion` and `nearby` answer the observation
// requests: a list, or a function of the request's query parameters.
export function mockEbird({ byRegion = observations, nearby = observations, speciesImage = { image: null, wikipediaUrl: null } } = {}) {
    const answer = (handler, params) => (typeof handler === 'function' ? handler(params) : handler)
    return mockFetch((url) => {
        const { pathname, searchParams: params } = new URL(url, 'http://localhost')
        const fn = pathname.split('/').pop()
        if (fn === 'fetchTaxonomy') return taxonomy
        if (fn === 'fetchRegions') {
            if (params.get('type') === 'country') return countries
            if (params.get('type') === 'subnational1') return params.get('parent') === 'US' ? regions : []
            return params.get('parent') === 'US-VA' ? subRegions : []
        }
        if (fn === 'fetchSpeciesList') return taxonomy.map(s => s.speciesCode)
        if (fn === 'fetchObservationsByRegion') return answer(byRegion, params)
        if (fn === 'fetchObservationsNearby') return answer(nearby, params)
        if (fn === 'fetchSpeciesImage') return speciesImage
        return undefined
    })
}

// Waits until some request to the function `fn` had all of `expected` as query parameters
export async function expectRequested(fetchMock, fn, expected) {
    await waitFor(() => {
        const matching = callsTo(fetchMock, fn).filter(params =>
            Object.entries(expected).every(([key, value]) => (value === null ? !params.has(key) : params.get(key) === value)))
        expect(matching.length, `no ${fn} request with ${JSON.stringify(expected)}`).toBeGreaterThan(0)
    })
}

export const currentUrl = () => window.location.pathname + window.location.search
export const currentParams = () => Object.fromEntries(new URLSearchParams(window.location.search))
