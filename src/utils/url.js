import { DEFAULT_DISTANCE_KM, DISTANCES_KM } from './geo'
import { DEFAULT_DAYS_BACK, parseDaysBack } from './daysBack'

// Shareable URLs for the two observation pages.
//
// Filters are kept in the query string:
//   /observations?country=US&region=US-VA&subregion=US-VA-059&days=7&species=carchi&notable=1&q=wren&view=map
//   /nearby?dist=10&days=7&species=carchi&notable=1&q=wren&view=map
// The Near me page never puts the visitor's location in the URL: a shared link means "near whoever opens it".
// An open observation adds its id to the path and its details to the query, so the modal can render
// from the URL alone:
//   /observations/S123456?country=US&...&code=carchi&commonName=Carolina+Chickadee&location=...&area=...&date=...&lat=...&lng=...

const OBSERVATION_PARAMS = ['code', 'commonName', 'location', 'area', 'date', 'lat', 'lng']

// The page part of a path: "/nearby/S123" -> "/nearby"
const pagePath = (pathname) => '/' + (pathname.split('/')[1] || 'observations')

// Copy of `search` with `values` written in; empty values are removed
const withParams = (search, values) => {
    const params = new URLSearchParams(search)
    for (const [key, value] of Object.entries(values)) {
        if (value) params.set(key, value)
        else params.delete(key)
    }
    return params
}

// Region page filters in the current URL, when it is a region page URL. Country defaults to the US and
// view (shared by both pages) to the list.
export const readUrlFilters = () => {
    const current = new URLSearchParams(window.location.search)
    const params = window.location.pathname.startsWith('/observations') ? current : new URLSearchParams()
    return {
        country: params.get('country') || 'US',
        region: params.get('region') ?? '',
        subregion: params.get('subregion') ?? '',
        species: params.get('species') ?? '',
        notable: params.get('notable') === '1',
        days: parseDaysBack(params.get('days')),
        view: current.get('view') === 'map' ? 'map' : 'list',
    }
}

// Copy of `search` with the region page's filters written in. Empty and default values are left out of the URL;
// observation params already in `search` are kept.
export const withFilters = (search, { country, region, subregion, species, notable, days, q, view }) => withParams(search, {
    country, region, subregion, species, q,
    days: days === DEFAULT_DAYS_BACK ? '' : String(days),
    notable: notable ? '1' : '',
    view: view === 'map' ? 'map' : '',
})

// Near me page filters in the current URL. Distance defaults to 5 km and days back to 3.
export const readNearbyFilters = () => {
    const params = new URLSearchParams(window.location.search)
    const dist = Number(params.get('dist'))
    return {
        dist: DISTANCES_KM.includes(dist) ? dist : DEFAULT_DISTANCE_KM,
        days: parseDaysBack(params.get('days')),
        species: params.get('species') ?? '',
        notable: params.get('notable') === '1',
        q: params.get('q') ?? '',
    }
}

// Copy of `search` with the Near me page's filters written in, leaving out defaults
export const withNearbyFilters = (search, { dist, days, species, notable, q, view }) => withParams(search, {
    dist: dist === DEFAULT_DISTANCE_KM ? '' : String(dist),
    days: days === DEFAULT_DAYS_BACK ? '' : String(days),
    species, q,
    notable: notable ? '1' : '',
    view: view === 'map' ? 'map' : '',
})

// The query string without an open observation's params, used to remember each page's filters
export const filtersOnly = (search) => {
    const params = new URLSearchParams(search)
    OBSERVATION_PARAMS.forEach(key => params.delete(key))
    const query = params.toString()
    return query ? `?${query}` : ''
}

// Link that opens an observation in the modal on the current page, keeping the filters in `search`
export const observationLink = (observation, search, pathname) => {
    const params = new URLSearchParams(search)
    params.set('code', observation.speciesCode)
    params.set('commonName', observation.comName)
    params.set('location', observation.locName)
    if (observation.area) params.set('area', observation.area)
    else params.delete('area')
    params.set('date', observation.obsDt)
    params.set('lat', observation.lat)
    params.set('lng', observation.lng)
    return `${pagePath(pathname)}/${encodeURIComponent(observation.subId)}?${params}`
}

// Link back to the current page's list, keeping the filters in `search` and dropping the observation params
export const listLink = (search, pathname) => `${pagePath(pathname)}${filtersOnly(search)}`

// Observation described by the path id and query, or null when there is no id or common name
export const readUrlObservation = (subId, params) => {
    const commonName = params.get('commonName')
    if (!subId || !commonName) return null
    return {
        subId,
        speciesCode: params.get('code'),
        commonName,
        location: params.get('location') ?? '',
        area: params.get('area'),
        date: params.get('date'),
        lat: parseFloat(params.get('lat')),
        lng: parseFloat(params.get('lng')),
    }
}
