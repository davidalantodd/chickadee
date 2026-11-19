import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { currentParams, expectRequested, mockEbird } from '../test/ebirdApi'
import { callsTo } from '../test/fetchMock'
import { stubNavigator } from '../test/navigator'

// The page remembers the visitor's position for the session in module state, so each test loads a fresh copy
let App
beforeEach(async () => {
    vi.resetModules()
    App = (await import('../App')).default
    vi.spyOn(console, 'error').mockImplementation(() => {})
})

const renderApp = (url) => {
    window.history.replaceState(null, '', url)
    return render(<App/>)
}

// Fakes the browser's location services. `permission` is what the Permissions API reports, or 'throws' where it's
// unsupported; `error` makes getCurrentPosition fail with that GeolocationPositionError code.
function stubLocation({ permission = 'prompt', error, available = true } = {}) {
    const getCurrentPosition = vi.fn((succeed, fail) => (error
        ? fail({ code: error, message: 'failed' })
        : succeed({ coords: { latitude: 37.229612, longitude: -80.413912 } })))
    stubNavigator({
        geolocation: available ? { getCurrentPosition } : undefined,
        permissions: { query: async () => {
            if (permission === 'throws') throw new TypeError('unsupported')
            return { state: permission }
        } },
    })
    return getCurrentPosition
}

const count = () => document.querySelector('.observation-count')
const useMyLocation = async (user) => user.click(await screen.findByRole('button', { name: 'Use my location' }))

describe('Near me page', () => {
    it('explains the location request before the browser asks, then shows birds nearby', async () => {
        const user = userEvent.setup()
        const getCurrentPosition = stubLocation()
        const fetchMock = mockEbird()
        renderApp('/nearby')

        expect(await screen.findByText(/rounded to about 1 km and never saved/)).toBeInTheDocument()
        expect(getCurrentPosition).not.toHaveBeenCalled()
        expect(count()).not.toBeInTheDocument()

        await useMyLocation(user)
        expect(getCurrentPosition).toHaveBeenCalledTimes(1)
        expect(await screen.findByText('Carolina Chickadee')).toBeInTheDocument()
        await expectRequested(fetchMock, 'fetchObservationsNearby', { lat: '37.23', lng: '-80.41', dist: '5', back: '3' })
        expect(count()).toHaveTextContent('3 recent bird observations within 5 km in the last 3 days')
    })

    it('shows how far away each sighting is', async () => {
        const user = userEvent.setup()
        stubLocation()
        mockEbird()
        renderApp('/nearby')
        await useMyLocation(user)
        expect(await screen.findByText('7.1 km away · near Blacksburg, Virginia')).toBeInTheDocument()
        // A sighting with no nearby town shows just its distance
        expect(screen.getByText('17 km away')).toBeInTheDocument()
    })

    it('never puts the position in the URL or sends it unrounded', async () => {
        const user = userEvent.setup()
        stubLocation()
        const fetchMock = mockEbird()
        renderApp('/nearby')
        await useMyLocation(user)
        await screen.findByText('Blue Jay')
        expect(window.location.search).toBe('')
        for (const params of callsTo(fetchMock, 'fetchObservationsNearby')) {
            expect(params.get('lat')).toBe('37.23')
            expect(params.get('lng')).toBe('-80.41')
        }
    })

    it('locates straight away when permission was already given', async () => {
        const getCurrentPosition = stubLocation({ permission: 'granted' })
        mockEbird()
        renderApp('/nearby')
        expect(await screen.findByText('Blue Jay')).toBeInTheDocument()
        expect(getCurrentPosition).toHaveBeenCalledTimes(1)
        expect(screen.queryByRole('button', { name: 'Use my location' })).not.toBeInTheDocument()
    })

    it('explains how to turn location back on when it\'s blocked, without asking', async () => {
        const getCurrentPosition = stubLocation({ permission: 'denied' })
        mockEbird()
        renderApp('/nearby')
        expect(await screen.findByText(/Location access is off for this site/)).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'browse by region' })).toHaveAttribute('href', '/observations')
        expect(screen.queryByRole('button', { name: /location|Try again/ })).not.toBeInTheDocument()
        expect(getCurrentPosition).not.toHaveBeenCalled()
    })

    it('treats declining the browser\'s prompt as blocked', async () => {
        const user = userEvent.setup()
        stubLocation({ error: 1 })
        mockEbird()
        renderApp('/nearby')
        await useMyLocation(user)
        expect(await screen.findByText(/Location access is off for this site/)).toBeInTheDocument()
    })

    it('offers to try again when the position can\'t be found, and recovers', async () => {
        const user = userEvent.setup()
        const getCurrentPosition = stubLocation({ error: 3 })
        mockEbird()
        renderApp('/nearby')
        await useMyLocation(user)
        expect(await screen.findByText(/couldn.t be found just now/)).toBeInTheDocument()

        getCurrentPosition.mockImplementation((succeed) => succeed({ coords: { latitude: 37.2296, longitude: -80.4139 } }))
        await user.click(screen.getByRole('button', { name: 'Try again' }))
        expect(await screen.findByText('Blue Jay')).toBeInTheDocument()
    })

    it('says so when the browser has no location services', async () => {
        stubLocation({ available: false })
        mockEbird()
        renderApp('/nearby')
        expect(await screen.findByText(/This browser can.t share its location/)).toBeInTheDocument()
    })

    it('asks with the explanation when the browser can\'t report the permission', async () => {
        stubLocation({ permission: 'throws' })
        mockEbird()
        renderApp('/nearby')
        expect(await screen.findByRole('button', { name: 'Use my location' })).toBeInTheDocument()
    })

    it('shows "finding your location" while it waits for the browser', async () => {
        const user = userEvent.setup()
        const getCurrentPosition = stubLocation()
        getCurrentPosition.mockImplementation(() => {})
        mockEbird()
        renderApp('/nearby')
        await useMyLocation(user)
        expect(screen.getByText('finding your location...')).toBeInTheDocument()
    })

    it('searches a larger radius and keeps it in the URL', async () => {
        const user = userEvent.setup()
        stubLocation({ permission: 'granted' })
        const fetchMock = mockEbird({ nearby: (params) => (params.get('dist') === '25' ? [] : undefined) })
        renderApp('/nearby')
        const radius = await screen.findByRole('radiogroup', { name: 'Search radius' })
        expect(within(radius).getByRole('radio', { name: '5 km' })).toHaveAttribute('aria-checked', 'true')

        await user.click(within(radius).getByRole('radio', { name: '25 km' }))
        await expectRequested(fetchMock, 'fetchObservationsNearby', { dist: '25' })
        expect(currentParams()).toEqual({ dist: '25' })
        expect(await screen.findByText(/no birds reported within 25 km in the last 3 days/)).toBeInTheDocument()
    })

    it('opens a shared link with its filters; "Clear filters" keeps the distance', async () => {
        const user = userEvent.setup()
        stubLocation({ permission: 'granted' })
        const fetchMock = mockEbird()
        renderApp('/nearby?dist=10&days=7&notable=1')
        await expectRequested(fetchMock, 'fetchObservationsNearby', { dist: '10', back: '7', notable: 'true' })
        await waitFor(() => expect(count()).toHaveTextContent('3 notable bird observations within 10 km in the last 7 days'))
        expect(screen.getByRole('button', { name: /^Filters/ })).toHaveTextContent('10 km · Notable · Last 7 days')

        await user.click(screen.getByRole('button', { name: 'Clear filters' }))
        await expectRequested(fetchMock, 'fetchObservationsNearby', { dist: '10', back: '3', notable: null })
        expect(currentParams()).toEqual({ dist: '10' })
    })

    it('offers only species reported nearby, and picking one turns off "Notable only"', async () => {
        const user = userEvent.setup()
        stubLocation({ permission: 'granted' })
        const fetchMock = mockEbird()
        renderApp('/nearby')
        await screen.findByText('Blue Jay')
        await user.click(screen.getByRole('button', { name: /Notable only/ }))
        await user.click(screen.getByRole('button', { name: 'All species' }))
        expect(await screen.findByRole('button', { name: 'Northern Cardinal' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Redhead' })).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Northern Cardinal' }))
        await expectRequested(fetchMock, 'fetchObservationsNearby', { species: 'norcar', notable: null })
        expect(currentParams()).toEqual({ species: 'norcar' })
        await user.click(screen.getByRole('button', { name: /Notable only/ }))
        expect(currentParams()).toEqual({ notable: '1' })
    })

    it('searches the nearby results and summarises the search', async () => {
        const user = userEvent.setup()
        stubLocation({ permission: 'granted' })
        mockEbird()
        renderApp('/nearby?days=1')
        await screen.findByText('Blue Jay')
        await user.type(screen.getByRole('searchbox'), 'chick')
        await waitFor(() => expect(count()).toHaveTextContent('1 of 3 recent bird observations within 5 km in the last day'))
        expect(screen.getByRole('button', { name: /^Filters/ })).toHaveTextContent('5 km · Last day · "chick"')
    })

    it('remembers the position for the session, and each tab remembers its own filters', async () => {
        const user = userEvent.setup()
        const getCurrentPosition = stubLocation()
        mockEbird()
        renderApp('/nearby?dist=10')
        await useMyLocation(user)
        await screen.findByText('Blue Jay')

        await user.click(screen.getByRole('link', { name: 'Explore' }))
        await waitFor(() => expect(window.location.pathname).toBe('/observations'))
        await user.click(screen.getByRole('link', { name: 'Near me' }))
        await waitFor(() => expect(window.location.pathname).toBe('/nearby'))
        expect(currentParams()).toEqual({ dist: '10' })
        expect(await screen.findByText('Blue Jay')).toBeInTheDocument()
        expect(getCurrentPosition).toHaveBeenCalledTimes(1)
    })

    it('opens details on the Near me page and shows the search area on the map', async () => {
        const user = userEvent.setup()
        stubLocation({ permission: 'granted' })
        mockEbird()
        const { container } = renderApp('/nearby')
        await user.click(await screen.findByText('Carolina Chickadee'))
        await screen.findByRole('dialog')
        expect(window.location.pathname).toBe('/nearby/S100')
        await user.click(screen.getByRole('button', { name: 'Close' }))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(window.location.pathname).toBe('/nearby')

        await user.click(screen.getByTitle('Switch to Map View'))
        await waitFor(() => expect(container.querySelector('.leaflet-container')).toBeInTheDocument())
        expect(currentParams()).toEqual({ view: 'map' })
    })
})
