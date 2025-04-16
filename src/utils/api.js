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

export const fetchObservationsByRegion = (currentRegion, currentSubRegion, notable, currentSpecies, setObservations, setLoading, setVisibleCount) => {
    setLoading(true);
    const regionToSearch = (currentSubRegion.code) ? currentSubRegion : currentRegion;
    return fetch(`/.netlify/functions/fetchObservationsByRegion?regionToSearch=${regionToSearch.code}&notable=${notable}&currentSpecies=${currentSpecies.speciesCode}`)
        .then(response => response.json())
        .then(data => {
            setObservations({
                region: regionToSearch.code,
                obs: data
            });
            setLoading(false);
            if (setVisibleCount) {
                setVisibleCount(100); // Reset visible count when new data is loaded
            }
            return data;
        })
        .catch(error => {
            console.error('Error fetching observations:', error, regionToSearch.code, notable, currentSpecies.comName);
            setLoading(false);
        });
}