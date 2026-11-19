import { vi } from 'vitest'

// Replaces fetch with a function that answers from `handler(url)`. The handler returns data to send as JSON,
// a Response to send as is, or undefined for a 404. It may return a promise, e.g. to hold a response back.
export function mockFetch(handler) {
    const fetchMock = vi.fn(async (url) => {
        const result = await handler(String(url))
        if (result instanceof Response) return result
        if (result === undefined) return new Response('Not found', { status: 404 })
        return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } })
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

// The query parameters of every call to `fetchMock` whose URL contains `path`
export const callsTo = (fetchMock, path) => fetchMock.mock.calls
    .map(([url]) => String(url))
    .filter(url => url.includes(path))
    .map(url => new URL(url, 'http://localhost').searchParams)

// A promise with its resolve function, for responses a test releases later
export function deferred() {
    let resolve
    const promise = new Promise(r => { resolve = r })
    return { promise, resolve }
}
