import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import L from 'leaflet'
import { describe, expect, it, vi } from 'vitest'
import ObservationMap from './ObservationMap'
import { renderWithContext } from '../test/renderWithContext'
import { manyObservations, observation, observations } from '../test/fixtures'

// Renders the map with `obs` loaded, keeping each Leaflet marker it creates so tests can open their popups
function renderMap(obs = observations, { searchArea, route = '/observations?region=US-VA' } = {}) {
    // Opening details reads the filters from the browser's URL, which the router keeps in step in the app
    window.history.replaceState(null, '', route)
    const markers = []
    const createMarker = L.marker
    vi.spyOn(L, 'marker').mockImplementation((...args) => {
        const marker = createMarker(...args)
        markers.push(marker)
        return marker
    })
    const loaded = { key: 'k', obs }
    const result = renderWithContext(<ObservationMap searchArea={searchArea}/>, {
        route, path: `/${route.split(/[/?]/)[1]}/:id?`, context: { observations: loaded, filteredObservations: loaded },
    })
    return { ...result, markers }
}

// The popup's content as Leaflet would show it, with the open event the map listens for
function openPopup(marker) {
    const container = document.createElement('div')
    container.innerHTML = marker.getPopup().getContent()
    document.body.append(container)
    marker.fire('popupopen', { popup: { _container: container } })
    return container
}

describe('ObservationMap', () => {
    it('places a marker for each observation with a position', async () => {
        const { markers } = renderMap([...observations, observation({ subId: 'S9', lat: null, lng: null })])
        await waitFor(() => expect(markers).toHaveLength(3))
        expect(markers.map(m => m.getLatLng().lat)).toEqual([37.28, 37.22, 37.1])
    })

    it('describes the bird in each marker\'s popup', async () => {
        const { markers } = renderMap()
        await waitFor(() => expect(markers).toHaveLength(3))
        const popup = openPopup(markers[0])
        expect(popup).toHaveTextContent('Carolina Chickadee')
        expect(popup).toHaveTextContent('Location: Pandapas Pond')
        expect(popup).toHaveTextContent('Area: near Blacksburg, Virginia')
        expect(popup).toHaveTextContent('Date: Mon, Nov 16, 2026, 8:30 AM')
        expect(popup.querySelector('img.map-popup-photo')).toHaveAttribute('src', 'https://img/popup.jpg')

        // No photo and no area: neither is shown
        const plain = openPopup(markers[1])
        expect(plain.querySelector('img')).not.toBeInTheDocument()
        expect(openPopup(markers[2])).not.toHaveTextContent('Area:')
    })

    it('escapes location names and credits so they can\'t inject HTML', async () => {
        const { markers } = renderMap([observation({
            comName: 'Jay <b>bold</b>',
            locName: '<img src=x onerror="alert(1)">Pond & "Marsh"',
            photo: { list: 'l', popup: 'p.jpg" onload="alert(2)', credit: "O'Brien <script>" },
        })])
        await waitFor(() => expect(markers).toHaveLength(1))
        const html = markers[0].getPopup().getContent()
        expect(html).not.toMatch(/<img src=x|<b>|<script>|" onload=/)
        const popup = openPopup(markers[0])
        expect(popup).toHaveTextContent('Location: <img src=x onerror="alert(1)">Pond & "Marsh"')
        expect(popup.querySelectorAll('img')).toHaveLength(1)
        expect(popup.querySelector('img')).not.toHaveAttribute('onload')
    })

    it('opens the bird\'s details when its popup is clicked', async () => {
        const { markers } = renderMap()
        await waitFor(() => expect(markers).toHaveLength(3))
        await userEvent.click(openPopup(markers[1]).querySelector('.map-popup'))
        expect(screen.getByTestId('location').textContent).toMatch(/^\/observations\/S101\?region=US-VA&code=norcar&commonName=Northern\+Cardinal/)
    })

    it('shows the first 100 birds at once and the rest shortly after', async () => {
        vi.useFakeTimers()
        try {
            const { markers } = renderMap(manyObservations(150))
            expect(markers).toHaveLength(100)
            act(() => vi.advanceTimersByTime(500))
            expect(markers).toHaveLength(100 + 150)
        } finally {
            vi.useRealTimers()
        }
    })

    it('shows nothing for no observations', () => {
        const { markers, container } = renderMap([])
        expect(markers).toHaveLength(0)
        expect(container.querySelector('.leaflet-container')).toBeInTheDocument()
    })

    it('fits the search radius on Near me, drawing it around the visitor', async () => {
        const fitBounds = vi.spyOn(L.Map.prototype, 'fitBounds')
        renderMap(observations, { searchArea: { lat: 37.23, lng: -80.41, radiusKm: 10 }, route: '/nearby' })
        await waitFor(() => expect(fitBounds).toHaveBeenCalled())
        const bounds = fitBounds.mock.calls[0][0]
        expect(bounds.getCenter().lat).toBeCloseTo(37.23, 2)
        // 10 km each way: about 0.18° of latitude across
        expect(bounds.getNorth() - bounds.getSouth()).toBeCloseTo(0.18, 1)
    })

    it('fits the observations on Explore, and doesn\'t refit on re-renders', async () => {
        const fitBounds = vi.spyOn(L.Map.prototype, 'fitBounds')
        const { rerender } = renderMap()
        await waitFor(() => expect(fitBounds).toHaveBeenCalledTimes(1))
        const bounds = fitBounds.mock.calls[0][0]
        expect(bounds.getSouth()).toBeCloseTo(37.1)
        expect(bounds.getNorth()).toBeCloseTo(37.28)
        expect(fitBounds.mock.calls[0][1]).toMatchObject({ maxZoom: 10 })
        rerender(<div/>)
        expect(fitBounds).toHaveBeenCalledTimes(1)
    })

    describe('full screen', () => {
        it('covers the page and exits with the button', async () => {
            const user = userEvent.setup()
            const { container } = renderMap()
            const button = screen.getByRole('button', { name: 'Full screen map' })
            await user.click(button)
            expect(container.querySelector('.observation-map-area')).toHaveClass('is-fullscreen')
            expect(document.body).toHaveClass('map-fullscreen-open')
            expect(button).toHaveAttribute('aria-pressed', 'true')

            await user.click(screen.getByRole('button', { name: 'Exit full screen' }))
            expect(container.querySelector('.observation-map-area')).not.toHaveClass('is-fullscreen')
            expect(document.body).not.toHaveClass('map-fullscreen-open')
        })

        it('exits with Escape, unless Escape is closing the details popup', async () => {
            const user = userEvent.setup()
            const { container } = renderMap()
            await user.click(screen.getByRole('button', { name: 'Full screen map' }))

            const modal = document.createElement('div')
            modal.className = 'modal show'
            document.body.append(modal)
            await user.keyboard('{Escape}')
            expect(container.querySelector('.observation-map-area')).toHaveClass('is-fullscreen')

            modal.remove()
            await user.keyboard('{Escape}')
            expect(container.querySelector('.observation-map-area')).not.toHaveClass('is-fullscreen')
        })

        it('uses browser full screen where available, leaving it with the map', async () => {
            const user = userEvent.setup()
            let fullscreenElement = null
            const exitFullscreen = vi.fn(async () => { fullscreenElement = null })
            document.documentElement.requestFullscreen = vi.fn(async () => { fullscreenElement = document.documentElement })
            Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreenElement })
            document.exitFullscreen = exitFullscreen
            try {
                const { container, unmount } = renderMap()
                await user.click(screen.getByRole('button', { name: 'Full screen map' }))
                expect(document.documentElement.requestFullscreen).toHaveBeenCalled()

                // Leaving browser full screen another way also leaves the map's
                fullscreenElement = null
                act(() => document.dispatchEvent(new Event('fullscreenchange')))
                expect(container.querySelector('.observation-map-area')).not.toHaveClass('is-fullscreen')

                await user.click(screen.getByRole('button', { name: 'Full screen map' }))
                await user.click(screen.getByRole('button', { name: 'Exit full screen' }))
                expect(exitFullscreen).toHaveBeenCalledTimes(1)

                await user.click(screen.getByRole('button', { name: 'Full screen map' }))
                unmount()
                expect(exitFullscreen).toHaveBeenCalledTimes(2)
            } finally {
                delete document.documentElement.requestFullscreen
                delete document.exitFullscreen
                delete document.fullscreenElement
            }
        })
    })
})
