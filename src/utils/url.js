// Shareable /observations URLs.
//
// Filters are kept in the query string:
//   /observations?country=US&region=US-VA&subregion=US-VA-059&species=carchi&notable=1&q=wren&view=map
// An open observation adds its id to the path and its details to the query, so the modal can render
// from the URL alone:
//   /observations/S123456?country=US&...&code=carchi&commonName=Carolina+Chickadee&location=...&area=...&date=...&lat=...&lng=...

const OBSERVATION_PARAMS = ['code', 'commonName', 'location', 'area', 'date', 'lat', 'lng']

// Filters in the current URL. Country defaults to the US and view to the list.
export const readUrlFilters = () => {
    const params = new URLSearchParams(window.location.search)
    return {
        country: params.get('country') || 'US',
        region: params.get('region') ?? '',
        subregion: params.get('subregion') ?? '',
        species: params.get('species') ?? '',
        notable: params.get('notable') === '1',
        view: params.get('view') === 'map' ? 'map' : 'list',
    }
}

// Copy of `search` with the filters written in. Empty and default values are left out of the URL;
// observation params already in `search` are kept.
export const withFilters = (search, { country, region, subregion, species, notable, q, view }) => {
    const params = new URLSearchParams(search)
    const values = {
        country, region, subregion, species, q,
        notable: notable ? '1' : '',
        view: view === 'map' ? 'map' : '',
    }
    for (const [key, value] of Object.entries(values)) {
        if (value) params.set(key, value)
        else params.delete(key)
    }
    return params
}

// Link that opens an observation in the modal, keeping the filters in `search`
export const observationLink = (observation, search) => {
    const params = new URLSearchParams(search)
    params.set('code', observation.speciesCode)
    params.set('commonName', observation.comName)
    params.set('location', observation.locName)
    if (observation.area) params.set('area', observation.area)
    else params.delete('area')
    params.set('date', observation.obsDt)
    params.set('lat', observation.lat)
    params.set('lng', observation.lng)
    return `/observations/${encodeURIComponent(observation.subId)}?${params}`
}

// Link to the list, keeping the filters in `search` and dropping the observation params
export const listLink = (search) => {
    const params = new URLSearchParams(search)
    OBSERVATION_PARAMS.forEach(key => params.delete(key))
    return `/observations?${params}`
}

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
