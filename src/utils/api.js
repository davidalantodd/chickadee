export const fetchRegionsInUS = () => {
    return fetch('/.netlify/functions/fetchRegionsInUS')
        .then(response => response.json())
        .catch(error => {
            console.error('Error fetching regions:', error);
        });
}

export const fetchSubRegions = (currentRegion) => {
    return fetch(`/.netlify/functions/fetchSubRegions?currentRegion=${currentRegion.code}`)
        .then(response => response.json())
        .catch(error => {
            console.error('Error fetching subregions:', error);
        });
}

export const fetchTaxonomy = () => {
    return fetch('/.netlify/functions/fetchTaxonomy')
    .then(response => response.json())
    .catch(error => {
        console.error('Error fetching taxonomy:', error);
    });
}