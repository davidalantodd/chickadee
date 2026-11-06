/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import ObservationList from './ObservationList'
import { useEffect, useContext, useState, useMemo } from 'react'
import React from 'react'
import { Form } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { fetchCountries, fetchRegionsByCountry, fetchSubRegions, fetchTaxonomy } from '../utils/api'
import CountryDropdown from './CountryDropdown'
import RegionDropdown from './RegionDropdown'
import SpeciesDropdown from './SpeciesDropdown'
import SubRegionDropdown from './SubRegionDropdown'
import ObservationMap from './ObservationMap'
import debounce from 'lodash/debounce';
import { useSearchParams } from 'react-router-dom'
import { withFilters } from '../utils/url'

function ObservationView() {
    const {setCountries, currentCountry, regions, setRegions,
        currentRegion, subRegions, setSubRegions,
        observations, notable, setNotable, setTaxonomy,
        setCurrentSpecies,
        filteredObservations, setFilteredObservations, viewType,
        currentSubRegion, currentSpecies} = useContext(ObservationsContext);

    const [searchParams, setSearchParams] = useSearchParams();
    const [filterText, setFilterText] = useState(() => searchParams.get('q') ?? '');

    // Write the filters to the URL. `replace` updates the current history entry, so filter changes
    // don't add Back button steps.
    useEffect(() => {
        setSearchParams(prev => withFilters(prev, {
            country: currentCountry.code,
            region: currentRegion.code,
            subregion: currentSubRegion.code,
            species: currentSpecies?.speciesCode,
            notable,
            q: filterText,
            view: viewType,
        }), { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCountry.code, currentRegion.code, currentSubRegion.code, currentSpecies?.speciesCode, notable, filterText, viewType])

    const handleNotableSwitch = () => {
        setNotable(!notable)
        setCurrentSpecies('')
    }
      
    useEffect(() => {
        fetchCountries()
            .then(data => setCountries(data));
        fetchTaxonomy()
            .then(data => {
                data.sort((a,b) => a.comName.localeCompare(b.comName))
                setTaxonomy(data)
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset and refetch regions when the country changes, ignoring responses for a stale country
    useEffect(() => {
        setRegions([])
        if (!currentCountry.code) return
        let cancelled = false
        fetchRegionsByCountry(currentCountry.code)
            .then(data => { if (!cancelled) setRegions(data) });
        return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCountry.code])

    // Reset and refetch subregions when the region changes, ignoring responses for a stale region
    useEffect(() => {
        setSubRegions([])
        if (!currentRegion.code) return
        let cancelled = false
        fetchSubRegions(currentRegion)
            .then(data => { if (!cancelled) setSubRegions(data) });
        return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRegion.code])

    // Debounced filter function
    const debouncedFilter = useMemo(
        () =>
            debounce((value) => {
                let filteredObs = observations.obs.filter((observation) =>
                    observation.comName.toLowerCase().includes(value.toLowerCase())
                );
                setFilteredObservations({
                    ...filteredObservations,
                    obs: filteredObs,
                });
            }, 300), // 300ms debounce delay
        [observations.obs, setFilteredObservations, filteredObservations]
    );

    // Handle filter input changes
    const handleFilterChange = (e) => {
        const value = e.target.value;
        setFilterText(value);
        debouncedFilter(value); 
    };

    useEffect(() => {
        // Filter observations based on the filter text
        const filteredObs = observations.obs.filter((observation) =>
            observation.comName.toLowerCase().includes(filterText.toLowerCase())
        );
        setFilteredObservations({
            ...filteredObservations,
            obs: filteredObs,
        });
    }, [observations.obs]);

    return (
        <>
                <section className="filter-bar">
                    <div className="filter-row">
                        <div className="filter-group">
                            <span className="filter-group-label">Location</span>
                            <div className="filter-group-controls location-path">
                                <CountryDropdown/>
                                {(regions.length > 0) ? (
                                    <span className="location-step">
                                        <span className="location-separator" aria-hidden="true">›</span>
                                        <RegionDropdown/>
                                    </span>
                                ) : null}
                                {(subRegions.length > 0) ? (
                                    <span className="location-step">
                                        <span className="location-separator" aria-hidden="true">›</span>
                                        <SubRegionDropdown/>
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <div className="filter-group">
                            <span className="filter-group-label">Species</span>
                            <div className="filter-group-controls">
                                <SpeciesDropdown />
                                <button
                                    type="button"
                                    className={`notable-toggle ${notable ? 'active' : ''}`}
                                    aria-pressed={notable}
                                    title="Show only rare or unusual sightings for this area"
                                    onClick={handleNotableSwitch}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                                        {notable ? (
                                            <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                                        ) : (
                                            <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
                                        )}
                                    </svg>
                                    Notable only
                                </button>
                            </div>
                        </div>
                        <div className="filter-group filter-search">
                            <Form.Control
                                id="observation-filter-input"
                                type="search"
                                placeholder="Search these results..."
                                aria-label="Search these results by bird name"
                                value={filterText}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>
                    <p className="observation-count">
                        {filterText
                            ? `${filteredObservations.obs.length} of ${observations.obs.length}`
                            : filteredObservations.obs.length}
                        {notable ? ' notable' : ' recent'} bird observations
                    </p>
                </section>
            {/* Render the observations */}
            {viewType === 'list' ? (<ObservationList className="observations-list-component"/>) : null}
            {viewType === 'map' ?  (<ObservationMap className="observations-map-component"/>) : null}
        </>
    )
}


export default ObservationView