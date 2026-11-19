import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ObservationList from './ObservationList'
import ObservationResults from './ObservationResults'
import Observation from './Observation'
import { renderWithContext } from '../test/renderWithContext'
import { manyObservations, observation, observations } from '../test/fixtures'

const loaded = (obs, key = 'k') => ({ observations: { key, obs }, filteredObservations: { key, obs } })
const cards = () => document.querySelectorAll('.observation-card')

describe('ObservationList', () => {
    it('shows each observation as a card', () => {
        renderWithContext(<ObservationList emptyMessage="none"/>, { context: loaded(observations) })
        expect(cards()).toHaveLength(3)
        expect(screen.getByText('Carolina Chickadee')).toBeInTheDocument()
    })

    it('shows the empty message when there\'s nothing to list', () => {
        renderWithContext(<ObservationList emptyMessage="no birds found"/>, { context: loaded([]) })
        expect(screen.getByRole('heading', { name: 'no birds found' })).toBeInTheDocument()
    })

    it('shows the searched results, not everything loaded', () => {
        renderWithContext(<ObservationList/>, { context: { observations: { key: 'k', obs: observations }, filteredObservations: { key: 'k', obs: [observations[2]] } } })
        expect(cards()).toHaveLength(1)
    })

    it('shows 100 at a time, adding more as the page scrolls to the bottom', () => {
        renderWithContext(<ObservationList/>, { context: loaded(manyObservations(250)) })
        expect(cards()).toHaveLength(100)
        expect(screen.getByText('loading more birds...')).toBeInTheDocument()
        act(() => { fireEvent.scroll(window) })
        expect(cards()).toHaveLength(200)
        act(() => { fireEvent.scroll(window) })
        expect(cards()).toHaveLength(250)
        expect(screen.queryByText('loading more birds...')).not.toBeInTheDocument()
        act(() => { fireEvent.scroll(window) })
        expect(cards()).toHaveLength(250)
    })
})

describe('Observation card', () => {
    const renderCard = (obs, index = 0) => {
        // Opening details reads the filters from the browser's URL, which the router keeps in step in the app
        window.history.replaceState(null, '', '/observations?q=x')
        return renderWithContext(<Observation observation={obs} index={index}/>, { route: '/observations?q=x' })
    }

    it('shows the photo, name, date, place and area', () => {
        renderCard(observation())
        const photo = document.querySelector('img.observation-card-thumb')
        expect(photo).toHaveAttribute('src', 'https://img/list.jpg')
        expect(photo).toHaveAttribute('srcset', 'https://img/list.jpg 120w, https://img/popup.jpg 250w')
        expect(photo).toHaveAttribute('title', 'Photo: Jane Doe / CC BY-SA 4.0')
        expect(screen.getByText('Mon, Nov 16, 2026, 8:30 AM')).toBeInTheDocument()
        expect(screen.getByText('near Blacksburg, Virginia')).toBeInTheDocument()
    })

    it('keeps the space for a missing photo, and hides a photo that fails to load', () => {
        renderCard(observation({ photo: null }))
        expect(document.querySelector('.observation-card-thumb-empty')).toBeInTheDocument()
        renderCard(observation())
        const photo = document.querySelector('img.observation-card-thumb')
        fireEvent.error(photo)
        expect(photo.style.visibility).toBe('hidden')
    })

    it('shades every other card', () => {
        renderCard(observation(), 0)
        renderCard(observation({ subId: 'S2' }), 1)
        const [first, second] = cards()
        expect(first).toHaveClass('observation-card-shaded')
        expect(second).not.toHaveClass('observation-card-shaded')
    })

    it('shortens long place names', () => {
        renderCard(observation({ locName: 'x'.repeat(100) }))
        expect(screen.getByText('x'.repeat(70) + '...')).toBeInTheDocument()
    })

    it.each([
        [{ distanceKm: 0.3 }, '300 m away · near Blacksburg, Virginia'],
        [{ distanceKm: 0, area: null }, '100 m away'],
        [{ area: null }, null],
    ])('shows distance and area as available (%j)', (overrides, expected) => {
        renderCard(observation(overrides))
        const area = document.querySelector('.observation-card-area')
        if (expected) expect(area).toHaveTextContent(expected)
        else expect(area).not.toBeInTheDocument()
    })

    it('opens the details on the current page, keeping the filters', async () => {
        renderCard(observation())
        await userEvent.click(screen.getByText('Carolina Chickadee'))
        expect(screen.getByTestId('location').textContent).toMatch(/^\/observations\/S100\?q=x&code=carchi/)
    })
})

describe('ObservationResults', () => {
    it('shows loading while observations for another query are still showing', () => {
        renderWithContext(<ObservationResults dataKey="new"/>, { context: loaded(observations, 'old') })
        expect(screen.getByText('loading birds...')).toBeInTheDocument()
    })

    it('shows loading while a request is in flight', () => {
        renderWithContext(<ObservationResults dataKey="k"/>, { context: { ...loaded(observations), loading: true } })
        expect(screen.getByText('loading birds...')).toBeInTheDocument()
    })

    it('shows the list or the map for the current query', () => {
        renderWithContext(<ObservationResults dataKey="k"/>, { context: loaded(observations) })
        expect(cards()).toHaveLength(3)
        const { container } = renderWithContext(<ObservationResults dataKey="k"/>, { context: { ...loaded(observations), viewType: 'map' } })
        expect(container.querySelector('.leaflet-container')).toBeInTheDocument()
    })
})
