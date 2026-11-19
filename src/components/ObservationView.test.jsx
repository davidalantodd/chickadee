import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { currentParams, expectRequested, mockEbird } from '../test/ebirdApi'
import { deferred } from '../test/fetchMock'
import { observations } from '../test/fixtures'
import { stubNavigator } from '../test/navigator'

const renderApp = (url) => {
    window.history.replaceState(null, '', url)
    return render(<App/>)
}
const count = () => document.querySelector('.observation-count')
// Opens the dropdown whose toggle reads `toggleText`, once it appears (region lists load after the page)
const openDropdown = async (user, toggleText) => {
    const toggle = await waitFor(() => {
        const found = screen.getAllByRole('button', { name: toggleText }).find(button => button.hasAttribute('aria-expanded'))
        expect(found).toBeTruthy()
        return found
    })
    await user.click(toggle)
}

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })

describe('Explore page', () => {
    it('shows recent observations in the US over the last 3 days by default', async () => {
        const fetchMock = mockEbird()
        renderApp('/observations')

        expect(await screen.findByText('Carolina Chickadee')).toBeInTheDocument()
        expect(screen.getByText('Northern Cardinal')).toBeInTheDocument()
        expect(screen.getByText('Blue Jay')).toBeInTheDocument()
        await expectRequested(fetchMock, 'fetchObservationsByRegion', { regionToSearch: 'US', back: '3', notable: 'false', currentSpecies: 'undefined' })
        expect(count()).toHaveTextContent('3 recent bird observations in the last 3 days')
        expect(currentParams()).toEqual({ country: 'US' })
        expect(screen.getByRole('button', { name: 'United States' })).toBeInTheDocument()
    })

    it('shows the town near each sighting', async () => {
        mockEbird()
        renderApp('/observations')
        expect(await screen.findAllByText('near Blacksburg, Virginia')).toHaveLength(2)
    })

    it('shows a loading message until the observations arrive', async () => {
        const response = deferred()
        mockEbird({ byRegion: (params) => (params.get('regionToSearch') === 'US' ? response.promise : []) })
        renderApp('/observations')
        expect(await screen.findByText('loading birds...')).toBeInTheDocument()
        expect(count()).toHaveTextContent('Loading…')
        response.resolve(observations)
        expect(await screen.findByText('Blue Jay')).toBeInTheDocument()
    })

    it('opens a shared link with its filters, and "Clear filters" resets them', async () => {
        const user = userEvent.setup()
        const fetchMock = mockEbird()
        renderApp('/observations?country=US&region=US-VA&days=7&notable=1')

        await expectRequested(fetchMock, 'fetchObservationsByRegion', { regionToSearch: 'US-VA', notable: 'true', back: '7' })
        expect(await screen.findByRole('button', { name: 'Virginia' })).toBeInTheDocument()
        await waitFor(() => expect(count()).toHaveTextContent('3 notable bird observations in the last 7 days'))
        expect(screen.getByRole('button', { name: /Notable only/ })).toHaveAttribute('aria-pressed', 'true')

        await user.click(screen.getByRole('button', { name: 'Clear filters' }))
        await expectRequested(fetchMock, 'fetchObservationsByRegion', { regionToSearch: 'US', notable: 'false', back: '3' })
        expect(currentParams()).toEqual({ country: 'US' })
        expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
    })

    it('narrows to a region and sub-region, and choosing another country clears them', async () => {
        const user = userEvent.setup()
        const fetchMock = mockEbird()
        renderApp('/observations')

        await openDropdown(user, 'All regions')
        await user.click(await screen.findByRole('button', { name: 'Virginia' }))
        await expectRequested(fetchMock, 'fetchObservationsByRegion', { regionToSearch: 'US-VA' })
        expect(currentParams()).toMatchObject({ region: 'US-VA' })

        await openDropdown(user, 'All sub-regions')
        await user.click(await screen.findByRole('button', { name: 'Montgomery' }))
        await expectRequested(fetchMock, 'fetchObservationsByRegion', { regionToSearch: 'US-VA-121' })
        expect(currentParams()).toMatchObject({ region: 'US-VA', subregion: 'US-VA-121' })

        await openDropdown(user, 'United States')
        await user.click(await screen.findByRole('button', { name: 'Canada' }))
        await expectRequested(fetchMock, 'fetchObservationsByRegion', { regionToSearch: 'CA' })
        expect(currentParams()).toEqual({ country: 'CA' })
        // Canada has no regions in the test data, so its region dropdown doesn't appear
        await waitFor(() => expect(screen.queryByRole('button', { name: 'All regions' })).not.toBeInTheDocument())
    })

    it('filters a dropdown\'s list by typing, saying when nothing matches', async () => {
        const user = userEvent.setup()
        mockEbird()
        renderApp('/observations')
        await openDropdown(user, 'All regions')
        const menu = document.querySelector('.region-dropdown-menu.show')
        const filter = within(menu).getByPlaceholderText('Filter regions...')
        await user.type(filter, 'north')
        expect(within(menu).getByRole('button', { name: 'North Carolina' })).toBeInTheDocument()
        expect(within(menu).queryByRole('button', { name: 'Virginia' })).not.toBeInTheDocument()
        await user.clear(filter)
        await user.type(filter, 'zzz')
        expect(within(menu).getByText('No matches')).toBeInTheDocument()
    })

    it('shows a prompt instead of results once the country is cleared', async () => {
        const user = userEvent.setup()
        mockEbird()
        renderApp('/observations')
        await openDropdown(user, 'United States')
        await user.click(within(document.querySelector('.region-dropdown-menu.show')).getByRole('button', { name: 'Clear Selection' }))
        expect(await screen.findByText('🐦 select a country to view birds')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Select country' })).toBeInTheDocument()
    })

    it('picking a species turns off "Notable only", and turning it on clears the species', async () => {
        const user = userEvent.setup()
        const fetchMock = mockEbird()
        renderApp('/observations?region=US-VA&notable=1')
        await screen.findByText('Blue Jay')

        await openDropdown(user, 'All species')
        await user.click(await screen.findByRole('button', { name: 'Northern Cardinal' }))
        await expectRequested(fetchMock, 'fetchObservationsByRegion', { regionToSearch: 'US-VA', notable: 'false', currentSpecies: 'norcar' })
        expect(currentParams()).toMatchObject({ species: 'norcar' })
        expect(currentParams()).not.toHaveProperty('notable')
        expect(screen.getByRole('button', { name: /Notable only/ })).toHaveAttribute('aria-pressed', 'false')

        await user.click(screen.getByRole('button', { name: /Notable only/ }))
        expect(currentParams()).toMatchObject({ notable: '1' })
        expect(currentParams()).not.toHaveProperty('species')
        expect(screen.getByRole('button', { name: 'All species' })).toBeInTheDocument()
    })

    it('limits the species dropdown to species seen recently, with a switch for every species ever recorded', async () => {
        const user = userEvent.setup()
        const fetchMock = mockEbird()
        renderApp('/observations?region=US-VA')
        await screen.findByText('Blue Jay')
        await openDropdown(user, 'All species')
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Redhead' })).not.toBeInTheDocument())
        expect(screen.getByRole('button', { name: 'Blue Jay' })).toBeInTheDocument()

        await user.click(screen.getByLabelText('Include species not seen recently'))
        await expectRequested(fetchMock, 'fetchSpeciesList', { regionCode: 'US-VA' })
        expect(await screen.findByRole('button', { name: 'Redhead' })).toBeInTheDocument()

        await user.type(screen.getByPlaceholderText('Filter species...'), 'xyz')
        expect(screen.getByText('No matches')).toBeInTheDocument()
    })

    it('changes how many days back to look', async () => {
        const user = userEvent.setup()
        const fetchMock = mockEbird()
        renderApp('/observations')
        await screen.findByText('Blue Jay')
        await openDropdown(user, 'Last 3 days')
        await user.click(within(document.querySelector('.days-dropdown .dropdown-menu')).getByRole('button', { name: 'Last 14 days' }))
        await expectRequested(fetchMock, 'fetchObservationsByRegion', { back: '14' })
        expect(currentParams()).toMatchObject({ days: '14' })
        await waitFor(() => expect(count()).toHaveTextContent('in the last 14 days'))

        await openDropdown(user, 'Last 14 days')
        await user.click(within(document.querySelector('.days-dropdown .dropdown-menu')).getByRole('button', { name: 'Last day' }))
        await waitFor(() => expect(count()).toHaveTextContent('3 recent bird observations in the last day'))
    })

    it('searches the loaded results by bird name and keeps the search in the URL', async () => {
        const user = userEvent.setup()
        mockEbird()
        renderApp('/observations')
        await screen.findByText('Blue Jay')
        await user.type(screen.getByRole('searchbox', { name: 'Search these results by bird name' }), 'jay')
        await waitFor(() => expect(count()).toHaveTextContent('1 of 3 recent bird observations'))
        expect(screen.queryByText('Carolina Chickadee')).not.toBeInTheDocument()
        expect(currentParams()).toMatchObject({ q: 'jay' })
    })

    it('starts with the search from a shared link', async () => {
        mockEbird()
        renderApp('/observations?q=cardinal')
        expect(await screen.findByText('Northern Cardinal')).toBeInTheDocument()
        expect(screen.queryByText('Blue Jay')).not.toBeInTheDocument()
        expect(screen.getByRole('searchbox')).toHaveValue('cardinal')
    })

    it.each([
        ['no sightings', () => []],
        ['a failed request', () => new Response('{"error":"down"}', { status: 502 })],
    ])('says no birds were found after %s', async (_, byRegion) => {
        mockEbird({ byRegion })
        renderApp('/observations')
        expect(await screen.findByText('no birds found 😔 try adjusting your filters')).toBeInTheDocument()
        expect(count()).toHaveTextContent('0 recent bird observations')
    })

    it('opens a bird\'s details from the list and closes back to it', async () => {
        const user = userEvent.setup()
        mockEbird()
        renderApp('/observations?region=US-VA')
        await user.click(await screen.findByText('Northern Cardinal'))

        const dialog = await screen.findByRole('dialog')
        expect(within(dialog).getByText('Northern Cardinal')).toBeInTheDocument()
        expect(within(dialog).getByText('Huckleberry Trail')).toBeInTheDocument()
        expect(window.location.pathname).toBe('/observations/S101')
        expect(currentParams()).toMatchObject({ region: 'US-VA', code: 'norcar' })

        await user.click(within(dialog).getByRole('button', { name: 'Close' }))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(window.location.pathname).toBe('/observations')
        expect(currentParams()).toEqual({ country: 'US', region: 'US-VA' })
        expect(screen.getByText('Northern Cardinal')).toBeInTheDocument()
    })

    it('switches between the list and the map, keeping the choice in the URL', async () => {
        const user = userEvent.setup()
        mockEbird()
        const { container } = renderApp('/observations')
        await screen.findByText('Blue Jay')

        await user.click(screen.getByTitle('Switch to Map View'))
        await waitFor(() => expect(container.querySelector('.leaflet-container')).toBeInTheDocument())
        expect(currentParams()).toMatchObject({ view: 'map' })
        expect(screen.getByTitle('Currently in Map View')).toHaveClass('active')

        await user.click(screen.getByTitle('Switch to List View'))
        expect(await screen.findByText('Blue Jay')).toBeInTheDocument()
        expect(currentParams()).not.toHaveProperty('view')
    })

    it('opens on the map from a shared map link', async () => {
        mockEbird()
        const { container } = renderApp('/observations?view=map')
        await waitFor(() => expect(container.querySelector('.leaflet-container')).toBeInTheDocument())
    })

    it('folds the filters behind a Filters button on phones, summarising what\'s active', async () => {
        const user = userEvent.setup()
        mockEbird()
        renderApp('/observations?region=US-VA&notable=1&days=7')
        const toggle = screen.getByRole('button', { name: /^Filters/ })
        expect(toggle).toHaveAttribute('aria-expanded', 'false')
        await waitFor(() => expect(toggle).toHaveTextContent('Virginia · Notable · Last 7 days'))
        expect(document.querySelector('.filter-row')).toHaveClass('is-collapsed')

        await user.click(toggle)
        expect(toggle).toHaveAttribute('aria-expanded', 'true')
        expect(toggle).not.toHaveTextContent('Virginia')
        expect(document.querySelector('.filter-row')).not.toHaveClass('is-collapsed')
    })

    it('includes the species and search in the summary', async () => {
        mockEbird()
        renderApp('/observations?species=carchi&q=chick')
        await waitFor(() => expect(screen.getByRole('button', { name: /^Filters/ })).toHaveTextContent('United States · Carolina Chickadee · "chick"'))
    })
})

describe('Header and home page', () => {
    it('starts at the home page, whose buttons open each page', async () => {
        const user = userEvent.setup()
        mockEbird()
        renderApp('/')
        expect(screen.getByRole('heading', { name: 'Recent bird sightings, worldwide' })).toBeInTheDocument()
        // The page tabs and list/map toggle only appear on the observation pages
        expect(screen.queryByRole('navigation', { name: 'Pages' })).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Browse sightings' }))
        expect(window.location.pathname).toBe('/observations')
        expect(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument()
    })

    it('opens Near me from the home page', async () => {
        const user = userEvent.setup()
        mockEbird()
        stubNavigator({ geolocation: undefined })
        renderApp('/')
        await user.click(screen.getByRole('button', { name: 'Birds near me' }))
        expect(window.location.pathname).toBe('/nearby')
    })

    it('switches between light and dark from the header', async () => {
        const user = userEvent.setup()
        mockEbird()
        renderApp('/')
        await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
        expect(document.documentElement).toHaveAttribute('data-bs-theme', 'dark')
        await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
        expect(document.documentElement).toHaveAttribute('data-bs-theme', 'light')
    })

    it('shows the back-to-top button after scrolling down, and scrolls up when clicked', async () => {
        const user = userEvent.setup()
        mockEbird()
        const scrollTo = vi.spyOn(window, 'scrollTo')
        renderApp('/')
        const button = screen.getByRole('button', { name: 'Scroll to top' })
        expect(button).not.toHaveClass('visible-button')
        window.scrollY = 500
        window.dispatchEvent(new Event('scroll'))
        await waitFor(() => expect(button).toHaveClass('visible-button'))
        await user.click(button)
        expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
        window.scrollY = 0
    })

    it('credits the data sources in the footer', () => {
        mockEbird()
        renderApp('/')
        expect(screen.getByRole('link', { name: 'eBird.org' })).toHaveAttribute('href', 'https://ebird.org')
        expect(screen.getByText(`©${new Date().getFullYear()} David Todd`)).toBeInTheDocument()
    })
})
