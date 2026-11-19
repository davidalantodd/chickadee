import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ObservationModal from './ObservationModal'
import { renderWithContext } from '../test/renderWithContext'
import { mockFetch } from '../test/fetchMock'
import { setMedia } from '../test/matchMedia'

const image = {
    urls: { list: 'l.jpg', popup: 'p.jpg', modalSmall: 'https://img/500px.jpg', modal: 'https://img/960px.jpg' },
    artist: 'Jane Doe',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Bird.jpg',
}

const link = (id, details = {}) => {
    const params = new URLSearchParams({
        region: 'US-VA', code: 'carchi', commonName: 'Carolina Chickadee', location: 'Pandapas Pond',
        area: 'Blacksburg, Virginia', date: '2026-11-16 08:30', lat: '37.28', lng: '-80.46', ...details,
    })
    for (const [key, value] of [...params]) if (value === '') params.delete(key)
    return `/observations/${id}?${params}`
}

const renderModal = (route, response = { image, wikipediaUrl: null }) => {
    const fetchMock = mockFetch(typeof response === 'function' ? response : () => response)
    const result = renderWithContext(<ObservationModal/>, { route })
    return { ...result, fetchMock }
}
const location = () => screen.getByTestId('location').textContent

describe('ObservationModal', () => {
    it('shows the observation described by the URL', async () => {
        renderModal(link('S100'))
        const dialog = await screen.findByRole('dialog')
        expect(within(dialog).getByText('Carolina Chickadee')).toHaveClass('modal-title')
        expect(within(dialog).getByText('Mon, Nov 16, 2026, 8:30 AM')).toBeInTheDocument()
        expect(within(dialog).getByText('Pandapas Pond')).toBeInTheDocument()
        expect(within(dialog).getByText('near Blacksburg, Virginia')).toBeInTheDocument()
    })

    it('shows the species photo at the right sizes, with its credit', async () => {
        const { fetchMock } = renderModal(link('S100'))
        const photo = await screen.findByRole('img', { name: 'Carolina Chickadee' })
        expect(photo).toHaveAttribute('src', 'https://img/960px.jpg')
        expect(photo).toHaveAttribute('srcset', 'https://img/500px.jpg 500w, https://img/960px.jpg 960w')
        expect(String(fetchMock.mock.calls[0][0])).toBe('/.netlify/functions/fetchSpeciesImage?speciesCode=carchi')

        const credit = document.querySelector('figcaption')
        expect(credit).toHaveTextContent('Photo: Jane Doe / CC BY-SA 4.0 / source')
        expect(within(credit).getByRole('link', { name: 'CC BY-SA 4.0' })).toHaveAttribute('href', image.licenseUrl)
        expect(within(credit).getByRole('link', { name: 'source' })).toHaveAttribute('href', image.filePageUrl)
    })

    it('credits an unknown author, and a licence with no link as plain text', async () => {
        renderModal(link('S100'), { image: { ...image, artist: null, licenseUrl: null, filePageUrl: null }, wikipediaUrl: null })
        await screen.findByRole('img', { name: 'Carolina Chickadee' })
        const credit = document.querySelector('figcaption')
        expect(credit).toHaveTextContent('Photo: Unknown author / CC BY-SA 4.0')
        expect(within(credit).queryByRole('link')).not.toBeInTheDocument()
    })

    it.each([
        ['has no photo', () => ({ image: null, wikipediaUrl: null })],
        ['photo request fails', () => new Response('error', { status: 500 })],
        ['photo request can\'t connect', () => { throw new TypeError('Failed to fetch') }],
    ])('shows the bundled chickadee when the species %s', async (_, response) => {
        renderModal(link('S100'), response)
        const photo = await screen.findByRole('img', { name: 'Carolina Chickadee' })
        expect(photo.getAttribute('src')).toMatch(/chickadee\.png$/)
        expect(photo).not.toHaveAttribute('srcset')
        expect(document.querySelector('figcaption')).not.toBeInTheDocument()
    })

    it('links a public checklist to eBird, and the species to Wikipedia by its name', async () => {
        renderModal(link('S100', { commonName: "Bewick's Wren" }))
        const checklist = await screen.findByRole('link', { name: /View full checklist on eBird/ })
        expect(checklist).toHaveAttribute('href', 'https://ebird.org/checklist/S100')
        expect(checklist).toHaveAttribute('target', '_blank')
        expect(screen.getByRole('link', { name: /Read about this bird on Wikipedia/ }))
            .toHaveAttribute('href', "https://en.wikipedia.org/wiki/Bewick's%20Wren")
        expect(screen.queryByText('Map shows the approximate area')).not.toBeInTheDocument()
    })

    it('uses the confirmed Wikipedia article when the server has one', async () => {
        renderModal(link('S100', { commonName: 'Redhead', code: 'redhea' }), { image: null, wikipediaUrl: 'https://en.wikipedia.org/wiki/Redhead_(bird)' })
        await waitFor(() => expect(screen.getByRole('link', { name: /Wikipedia/ })).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Redhead_(bird)'))
    })

    it.each(['P1a2b3c4d5e6f7a8b', 'S12x', 'L123', 's123'])('hides the eBird link for the non-checklist id %s, noting the map is approximate', async (id) => {
        renderModal(link(id, { location: 'Private location' }))
        await screen.findByRole('dialog')
        expect(screen.queryByRole('link', { name: /eBird/ })).not.toBeInTheDocument()
        expect(screen.getByText('Map shows the approximate area')).toBeInTheDocument()
    })

    it('copes with missing details: no date, no area, no position', async () => {
        renderModal(link('S100', { date: '', area: '', lat: '', lng: '' }))
        const dialog = await screen.findByRole('dialog')
        expect(within(dialog).getByText('Date unknown')).toBeInTheDocument()
        expect(within(dialog).queryByText('Area')).not.toBeInTheDocument()
        expect(dialog.querySelector('.observation-modal-map')).not.toBeInTheDocument()
    })

    it('ignores coordinates that aren\'t numbers', async () => {
        renderModal(link('S100', { lat: 'north', lng: '-80' }))
        const dialog = await screen.findByRole('dialog')
        expect(dialog.querySelector('.observation-modal-map')).not.toBeInTheDocument()
    })

    it('shows the spot on a map once open, draggable with a mouse but not on touch screens', async () => {
        renderModal(link('S100'))
        const dialog = await screen.findByRole('dialog')
        await waitFor(() => expect(dialog.querySelector('.leaflet-container')).toBeInTheDocument())
        expect(dialog.querySelector('.leaflet-container')).toHaveClass('leaflet-grab')
        expect(dialog.querySelector('.leaflet-marker-icon')).toBeInTheDocument()
    })

    it('keeps the map still on touch screens, so swiping scrolls the popup', async () => {
        setMedia('(pointer: fine)', false)
        renderModal(link('S100'))
        const dialog = await screen.findByRole('dialog')
        await waitFor(() => expect(dialog.querySelector('.leaflet-container')).toBeInTheDocument())
        expect(dialog.querySelector('.leaflet-container')).not.toHaveClass('leaflet-grab')
    })

    it('stays closed without an observation id or a common name', () => {
        renderModal('/observations?region=US-VA')
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        renderModal('/observations/S100?code=carchi')
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('closes a pasted link to the list it belongs to, keeping its filters', async () => {
        const user = userEvent.setup()
        renderModal(link('S100'))
        await user.click(await screen.findByRole('button', { name: 'Close' }))
        await waitFor(() => expect(location()).toBe('/observations?region=US-VA'))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('closes with the Escape key', async () => {
        const user = userEvent.setup()
        renderModal(link('S100'))
        await screen.findByRole('dialog')
        await user.keyboard('{Escape}')
        await waitFor(() => expect(location()).toBe('/observations?region=US-VA'))
    })
})
