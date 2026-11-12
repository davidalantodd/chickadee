import { useEffect, useContext, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { fetchCountries, fetchObservationsByRegion, fetchRegionsByCountry, fetchSubRegions } from '../utils/api'
import { filtersOnly, withFilters } from '../utils/url'
import { mostSpecificRegion, useObservationLoader } from '../hooks/useObservations'
import { useRegionSpeciesCodes } from '../hooks/useRegionSpeciesCodes'
import { useResultSearch } from '../hooks/useResultSearch'
import CountryDropdown from './CountryDropdown'
import RegionDropdown from './RegionDropdown'
import SubRegionDropdown from './SubRegionDropdown'
import SpeciesDropdown from './SpeciesDropdown'
import NotableToggle from './filters/NotableToggle'
import SearchBox from './filters/SearchBox'
import ResultSummary from './filters/ResultSummary'
import ObservationResults from './ObservationResults'

// The Explore page: recent observations in a chosen country, region or sub-region
function ObservationView() {
    const { setCountries, currentCountry, regions, setRegions,
        currentRegion, setCurrentRegion, subRegions, setSubRegions,
        currentSubRegion, setCurrentSubRegion, currentSpecies, setCurrentSpecies,
        notable, setNotable, viewType, lastSearch } = useContext(ObservationsContext)

    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()
    const { filterText, setSearch, clearSearch } = useResultSearch(searchParams.get('q') ?? '')
    // Whether the species dropdown offers every species ever recorded in the region
    const [allTimeSpecies, setAllTimeSpecies] = useState(false)

    const regionCode = mostSpecificRegion(currentCountry, currentRegion, currentSubRegion)?.code
    const speciesCodes = useRegionSpeciesCodes(regionCode, allTimeSpecies)

    // Load the region's observations whenever the query changes
    const dataKey = regionCode ? `region|${regionCode}|${notable}|${currentSpecies?.speciesCode ?? ''}` : ''
    useObservationLoader(dataKey, () => fetchObservationsByRegion(regionCode, notable, currentSpecies?.speciesCode))

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

    // Remember this page's filters so the header tab returns to them
    useEffect(() => { lastSearch.current.observations = filtersOnly(location.search) }, [location.search, lastSearch])

    useEffect(() => {
        fetchCountries().then(data => setCountries(data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Reset and refetch regions when the country changes, ignoring responses for a stale country
    useEffect(() => {
        setRegions([])
        if (!currentCountry.code) return
        let cancelled = false
        fetchRegionsByCountry(currentCountry.code)
            .then(data => { if (!cancelled) setRegions(data) })
        return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCountry.code])

    // Reset and refetch subregions when the region changes, ignoring responses for a stale region
    useEffect(() => {
        setSubRegions([])
        if (!currentRegion.code) return
        let cancelled = false
        fetchSubRegions(currentRegion)
            .then(data => { if (!cancelled) setSubRegions(data) })
        return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRegion.code])

    // Notable sightings and a single species are separate eBird queries, so choosing one clears the other
    const handleNotableToggle = () => {
        setNotable(!notable)
        setCurrentSpecies('')
    }
    const handleSpeciesSelect = (species) => {
        setCurrentSpecies(species)
        if (species) setNotable(false)
    }

    // Everything "Clear filters" resets. The country and list/map view are kept: without a country
    // there's nothing to show, and the view is a display choice rather than a filter.
    const hasActiveFilters = Boolean(currentRegion.code || currentSubRegion.code || currentSpecies || notable || filterText)
    const handleClearFilters = () => {
        setCurrentRegion({ code: '', name: '' })
        setCurrentSubRegion({ code: '', name: '' })
        setCurrentSpecies('')
        setNotable(false)
        clearSearch()
    }

    return (
        <>
            <section className="filter-bar">
                <div className="filter-row">
                    <div className="filter-group">
                        <span className="filter-group-label">Location</span>
                        <div className="filter-group-controls location-path">
                            <CountryDropdown/>
                            {regions.length > 0 && (
                                <span className="location-step">
                                    <span className="location-separator" aria-hidden="true">›</span>
                                    <RegionDropdown/>
                                </span>
                            )}
                            {subRegions.length > 0 && (
                                <span className="location-step">
                                    <span className="location-separator" aria-hidden="true">›</span>
                                    <SubRegionDropdown/>
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="filter-group">
                        <span className="filter-group-label">Species</span>
                        <div className="filter-group-controls">
                            <SpeciesDropdown
                                selected={currentSpecies}
                                onSelect={handleSpeciesSelect}
                                speciesCodes={speciesCodes}
                                allTime={allTimeSpecies}
                                onAllTimeChange={regionCode ? setAllTimeSpecies : undefined}
                            />
                            <NotableToggle notable={notable} onToggle={handleNotableToggle}/>
                        </div>
                    </div>
                    <SearchBox value={filterText} onChange={setSearch}/>
                </div>
                <ResultSummary
                    searching={Boolean(filterText)}
                    notable={notable}
                    onClear={hasActiveFilters ? handleClearFilters : undefined}
                />
            </section>
            <ObservationResults
                dataKey={dataKey}
                emptyMessage={currentCountry.code ? 'no birds found 😔 try adjusting your filters' : '🐦 select a country to view birds'}
            />
        </>
    )
}

export default ObservationView
