/* eslint-disable react-refresh/only-export-components */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { vi } from 'vitest'
import { ObservationsContext } from '../contexts/ObservationsContext'

// The shared state App provides, with empty data and mock setters; tests override what they need
export const contextValue = (overrides = {}) => ({
    observations: { key: '', obs: [] }, setObservations: vi.fn(),
    filteredObservations: { key: '', obs: [] }, setFilteredObservations: vi.fn(),
    countries: [], setCountries: vi.fn(),
    currentCountry: { code: 'US', name: '' }, setCurrentCountry: vi.fn(),
    regions: [], setRegions: vi.fn(),
    currentRegion: { code: '', name: '' }, setCurrentRegion: vi.fn(),
    subRegions: [], setSubRegions: vi.fn(),
    currentSubRegion: { code: '', name: '' }, setCurrentSubRegion: vi.fn(),
    notable: false, setNotable: vi.fn(),
    daysBack: 3, setDaysBack: vi.fn(),
    taxonomy: [], setTaxonomy: vi.fn(),
    currentSpecies: '', setCurrentSpecies: vi.fn(),
    loading: false, setLoading: vi.fn(),
    viewType: 'list', setViewType: vi.fn(),
    filtersOpen: false, setFiltersOpen: vi.fn(),
    lastSearch: { current: { observations: '', nearby: '' } },
    ...overrides,
})

// Shows the router's current location, so tests can check where a click navigated
function LocationProbe() {
    const location = useLocation()
    return <output data-testid="location">{location.pathname + location.search}</output>
}

// Renders `ui` inside the shared state and a router at `route`, matched against `path`
export function renderWithContext(ui, { context = {}, route = '/observations', path = '/observations/:id?' } = {}) {
    const value = contextValue(context)
    const result = render(
        <ObservationsContext.Provider value={value}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path={path} element={<>{ui}<LocationProbe/></>}/>
                    <Route path="*" element={<LocationProbe/>}/>
                </Routes>
            </MemoryRouter>
        </ObservationsContext.Provider>
    )
    return { ...result, context: value }
}
