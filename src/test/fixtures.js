// Sample data in the shapes the Netlify functions return

export const taxonomy = [
    { speciesCode: 'carchi', comName: 'Carolina Chickadee' },
    { speciesCode: 'norcar', comName: 'Northern Cardinal' },
    { speciesCode: 'blujay', comName: 'Blue Jay' },
    { speciesCode: 'redhea', comName: 'Redhead' },
]

export const countries = [
    { code: 'CA', name: 'Canada' },
    { code: 'US', name: 'United States' },
    { code: 'AR', name: 'Argentina' },
]

export const regions = [
    { code: 'US-VA', name: 'Virginia' },
    { code: 'US-NC', name: 'North Carolina' },
]

export const subRegions = [
    { code: 'US-VA-121', name: 'Montgomery' },
]

export const observation = (overrides = {}) => ({
    subId: 'S100',
    speciesCode: 'carchi',
    comName: 'Carolina Chickadee',
    locName: 'Pandapas Pond',
    area: 'Blacksburg, Virginia',
    obsDt: '2026-11-16 08:30',
    lat: 37.28,
    lng: -80.46,
    photo: { list: 'https://img/list.jpg', popup: 'https://img/popup.jpg', credit: 'Photo: Jane Doe / CC BY-SA 4.0' },
    ...overrides,
})

export const observations = [
    observation(),
    observation({ subId: 'S101', speciesCode: 'norcar', comName: 'Northern Cardinal', locName: 'Huckleberry Trail', lat: 37.22, lng: -80.42, photo: null }),
    observation({ subId: 'S102', speciesCode: 'blujay', comName: 'Blue Jay', locName: 'Private location', area: null, lat: 37.1, lng: -80.5 }),
]

// `count` observations with distinct ids and positions
export const manyObservations = (count) => Array.from({ length: count }, (_, i) => observation({
    subId: `S${1000 + i}`,
    comName: `Bird ${i}`,
    lat: 37 + i / 1000,
    lng: -80 - i / 1000,
}))
