// Fetch JSON from a Netlify function, resolving to [] on any failure so callers can always assume an array
const fetchList = (url, label) => {
    return fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .catch(error => {
            console.error(`Error fetching ${label}:`, error);
            return [];
        });
}

const fetchRegions = (type, parent, label) => {
    return fetchList(`/.netlify/functions/fetchRegions?type=${type}&parent=${encodeURIComponent(parent)}`, label);
}

// Countries sorted alphabetically, with the US pinned to the top
export const fetchCountries = () => {
    return fetchRegions('country', 'world', 'countries')
        .then(countries => countries.sort((a, b) => {
            if (a.code === 'US') return -1;
            if (b.code === 'US') return 1;
            return a.name.localeCompare(b.name);
        }));
}

export const fetchRegionsByCountry = (countryCode) => {
    return fetchRegions('subnational1', countryCode, 'regions');
}

export const fetchSubRegions = (currentRegion) => {
    return fetchRegions('subnational2', currentRegion.code, 'subregions');
}

export const fetchTaxonomy = () => {
    return fetchList('/.netlify/functions/fetchTaxonomy', 'taxonomy');
}

export const fetchObservationsByRegion = (regionCode, notable, speciesCode) => {
    return fetchList(`/.netlify/functions/fetchObservationsByRegion?regionToSearch=${encodeURIComponent(regionCode)}&notable=${notable}&currentSpecies=${speciesCode}`, 'observations');
}
