/* eslint-disable react/prop-types */
import { act, renderHook, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { useTheme } from './useTheme'
import { useResultSearch } from './useResultSearch'
import { useRegionSpeciesCodes } from './useRegionSpeciesCodes'
import { useObservationLoader, mostSpecificRegion } from './useObservations'
import { useSpeciesName } from './useSpeciesName'
import { setMedia } from '../test/matchMedia'
import { deferred, mockFetch } from '../test/fetchMock'
import { observations, taxonomy } from '../test/fixtures'

const theme = () => document.documentElement.getAttribute('data-bs-theme')

describe('useTheme', () => {
    it('follows the browser\'s light setting with nothing picked', () => {
        const { result } = renderHook(() => useTheme())
        expect(result.current.theme).toBe('light')
        expect(theme()).toBe('light')
    })

    it('follows the browser\'s dark setting, and changes when the system setting does', () => {
        setMedia('(prefers-color-scheme: dark)', true)
        const { result } = renderHook(() => useTheme())
        expect(result.current.theme).toBe('dark')
        act(() => setMedia('(prefers-color-scheme: dark)', false))
        expect(result.current.theme).toBe('light')
        expect(theme()).toBe('light')
    })

    it('remembers a pick that differs from the browser, and keeps it when the system setting changes', () => {
        const { result } = renderHook(() => useTheme())
        act(() => result.current.toggleTheme())
        expect(result.current.theme).toBe('dark')
        expect(localStorage.getItem('theme')).toBe('dark')
        act(() => setMedia('(prefers-color-scheme: dark)', false))
        expect(result.current.theme).toBe('dark')
    })

    it('goes back to following the browser when the pick matches it again', () => {
        const { result } = renderHook(() => useTheme())
        act(() => result.current.toggleTheme())
        act(() => result.current.toggleTheme())
        expect(result.current.theme).toBe('light')
        expect(localStorage.getItem('theme')).toBeNull()
        act(() => setMedia('(prefers-color-scheme: dark)', true))
        expect(result.current.theme).toBe('dark')
    })

    it('starts from a remembered pick', () => {
        localStorage.setItem('theme', 'dark')
        expect(renderHook(() => useTheme()).result.current.theme).toBe('dark')
    })

    it('ignores a stored value that isn\'t a theme', () => {
        localStorage.setItem('theme', 'purple')
        expect(renderHook(() => useTheme()).result.current.theme).toBe('light')
    })

    it('still switches when storage is blocked, for as long as the page is open', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError') })
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('SecurityError') })
        const { result } = renderHook(() => useTheme())
        expect(result.current.theme).toBe('light')
        act(() => result.current.toggleTheme())
        expect(result.current.theme).toBe('dark')
    })

    it('stops listening to the system setting once unmounted', () => {
        const { result, unmount } = renderHook(() => useTheme())
        unmount()
        setMedia('(prefers-color-scheme: dark)', true)
        expect(result.current.theme).toBe('light')
    })
})

// The shared state that the observation hooks read and write, held in real React state
function stateWrapper(initial = {}) {
    const state = {}
    function Wrapper({ children }) {
        const [obs, setObservations] = useState(initial.observations ?? { key: '', obs: [] })
        const [filtered, setFilteredObservations] = useState({ key: '', obs: [] })
        const [loading, setLoading] = useState(false)
        Object.assign(state, { observations: obs, filteredObservations: filtered, loading, setObservations })
        return (
            <ObservationsContext.Provider value={{ observations: obs, setObservations, filteredObservations: filtered,
                setFilteredObservations, loading, setLoading, taxonomy: initial.taxonomy ?? [] }}>
                {children}
            </ObservationsContext.Provider>
        )
    }
    return { Wrapper, state }
}

describe('useResultSearch', () => {
    afterEach(() => vi.useRealTimers())
    const loaded = { key: 'k', obs: observations }

    it('shows everything with no search, and narrows by bird name ignoring case', () => {
        vi.useFakeTimers()
        const { Wrapper, state } = stateWrapper({ observations: loaded })
        const { result } = renderHook(() => useResultSearch(), { wrapper: Wrapper })
        expect(state.filteredObservations.obs).toHaveLength(3)

        act(() => result.current.setSearch('CARD'))
        expect(result.current.filterText).toBe('CARD')
        // Typing is debounced
        expect(state.filteredObservations.obs).toHaveLength(3)
        act(() => vi.advanceTimersByTime(300))
        expect(state.filteredObservations.obs.map(o => o.comName)).toEqual(['Northern Cardinal'])
    })

    it('only applies the last of several quick keystrokes', () => {
        vi.useFakeTimers()
        const { Wrapper, state } = stateWrapper({ observations: loaded })
        const { result } = renderHook(() => useResultSearch(), { wrapper: Wrapper })
        act(() => result.current.setSearch('b'))
        act(() => vi.advanceTimersByTime(200))
        act(() => result.current.setSearch('bl'))
        act(() => vi.advanceTimersByTime(200))
        expect(state.filteredObservations.obs).toHaveLength(3)
        act(() => vi.advanceTimersByTime(100))
        expect(state.filteredObservations.obs.map(o => o.comName)).toEqual(['Blue Jay'])
    })

    it('starts from search text in the URL and filters newly loaded observations straight away', () => {
        const { Wrapper, state } = stateWrapper()
        renderHook(() => useResultSearch('jay'), { wrapper: Wrapper })
        act(() => state.setObservations(loaded))
        expect(state.filteredObservations).toEqual({ key: 'k', obs: [observations[2]] })
    })

    it('clears at once, cancelling a pending search', () => {
        vi.useFakeTimers()
        const { Wrapper, state } = stateWrapper({ observations: loaded })
        const { result } = renderHook(() => useResultSearch('jay'), { wrapper: Wrapper })
        act(() => result.current.setSearch('cardinal'))
        act(() => result.current.clearSearch())
        expect(result.current.filterText).toBe('')
        expect(state.filteredObservations.obs).toHaveLength(3)
        act(() => vi.advanceTimersByTime(500))
        expect(state.filteredObservations.obs).toHaveLength(3)
    })

    it('finds nothing for text no bird name contains', () => {
        const { Wrapper, state } = stateWrapper({ observations: loaded })
        renderHook(() => useResultSearch('zzz'), { wrapper: Wrapper })
        expect(state.filteredObservations.obs).toEqual([])
    })
})

describe('useObservationLoader', () => {
    it('loads observations under their key, and clears them for an empty key', async () => {
        const { Wrapper, state } = stateWrapper()
        const load = vi.fn(async () => observations)
        const { rerender } = renderHook(({ key }) => useObservationLoader(key, load), { wrapper: Wrapper, initialProps: { key: 'a' } })
        expect(state.loading).toBe(true)
        await waitFor(() => expect(state.observations).toEqual({ key: 'a', obs: observations }))
        expect(state.loading).toBe(false)

        rerender({ key: '' })
        expect(state.observations).toEqual({ key: '', obs: [] })
        expect(load).toHaveBeenCalledTimes(1)
    })

    it('ignores a slow response for a key that has since changed', async () => {
        const { Wrapper, state } = stateWrapper()
        const slow = deferred()
        const fast = deferred()
        const { rerender } = renderHook(({ key, load }) => useObservationLoader(key, load), {
            wrapper: Wrapper, initialProps: { key: 'slow', load: () => slow.promise },
        })
        rerender({ key: 'fast', load: () => fast.promise })
        await act(async () => fast.resolve([observations[0]]))
        await act(async () => slow.resolve(observations))
        expect(state.observations).toEqual({ key: 'fast', obs: [observations[0]] })
    })

    it('doesn\'t reload when only the load function changes', () => {
        const { Wrapper } = stateWrapper()
        const first = vi.fn(async () => [])
        const second = vi.fn(async () => [])
        const { rerender } = renderHook(({ load }) => useObservationLoader('same', load), { wrapper: Wrapper, initialProps: { load: first } })
        rerender({ load: second })
        expect(first).toHaveBeenCalledTimes(1)
        expect(second).not.toHaveBeenCalled()
    })
})

describe('mostSpecificRegion', () => {
    const none = { code: '' }
    it('prefers the sub-region, then the region, then the country', () => {
        expect(mostSpecificRegion({ code: 'US' }, { code: 'US-VA' }, { code: 'US-VA-121' }).code).toBe('US-VA-121')
        expect(mostSpecificRegion({ code: 'US' }, { code: 'US-VA' }, none).code).toBe('US-VA')
        expect(mostSpecificRegion({ code: 'US' }, none, none).code).toBe('US')
        expect(mostSpecificRegion(none, none, none)).toBeUndefined()
    })
})

describe('useRegionSpeciesCodes', () => {
    it('offers the species seen recently in the region', async () => {
        const fetchMock = mockFetch(() => observations)
        const { result } = renderHook(() => useRegionSpeciesCodes('US-VA', false, 7))
        await waitFor(() => expect(result.current).toEqual(new Set(['carchi', 'norcar', 'blujay'])))
        expect(String(fetchMock.mock.calls[0][0])).toContain('fetchObservationsByRegion?regionToSearch=US-VA&notable=false&currentSpecies=undefined&back=7')
    })

    it('offers every species ever recorded when asked', async () => {
        const fetchMock = mockFetch(() => ['carchi', 'redhea'])
        const { result } = renderHook(() => useRegionSpeciesCodes('US-VA', true, 7))
        await waitFor(() => expect(result.current).toEqual(new Set(['carchi', 'redhea'])))
        expect(String(fetchMock.mock.calls[0][0])).toContain('fetchSpeciesList?regionCode=US-VA')
    })

    it('offers the whole taxonomy (null) with no region, or when the request fails or finds nothing', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(renderHook(() => useRegionSpeciesCodes('', false, 3)).result.current).toBeNull()

        mockFetch(() => new Response('', { status: 500 }))
        const failed = renderHook(() => useRegionSpeciesCodes('US', false, 3))
        await waitFor(() => expect(fetch).toHaveBeenCalled())
        expect(failed.result.current).toBeNull()

        mockFetch(() => [])
        const empty = renderHook(() => useRegionSpeciesCodes('US', true, 3))
        await waitFor(() => expect(fetch).toHaveBeenCalled())
        expect(empty.result.current).toBeNull()
    })

    it('keeps the latest region\'s species when an earlier request answers last', async () => {
        const responses = { 'US-VA': deferred(), 'US-NC': deferred() }
        mockFetch((url) => responses[new URL(url, 'http://x').searchParams.get('regionToSearch')].promise)
        const { result, rerender } = renderHook(({ region }) => useRegionSpeciesCodes(region, false, 3), { initialProps: { region: 'US-VA' } })
        rerender({ region: 'US-NC' })
        await act(async () => responses['US-NC'].resolve([observations[1]]))
        await act(async () => responses['US-VA'].resolve([observations[0]]))
        expect(result.current).toEqual(new Set(['norcar']))
    })
})

describe('useSpeciesName', () => {
    const wrapper = stateWrapper({ taxonomy }).Wrapper
    it('looks up the name by code, shows the code until the taxonomy has it, and is empty with nothing selected', () => {
        expect(renderHook(() => useSpeciesName({ speciesCode: 'carchi' }), { wrapper }).result.current).toBe('Carolina Chickadee')
        expect(renderHook(() => useSpeciesName({ speciesCode: 'zzz' }), { wrapper }).result.current).toBe('zzz')
        expect(renderHook(() => useSpeciesName(''), { wrapper }).result.current).toBe('')
    })
})
