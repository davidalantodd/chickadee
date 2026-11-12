import { useCallback, useContext, useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { fetchObservationsNearby } from '../utils/api'
import { filtersOnly, readNearbyFilters, withNearbyFilters } from '../utils/url'
import { distanceKm, getRoundedPosition, locationPermission } from '../utils/geo'
import { useObservationLoader } from '../hooks/useObservations'
import { useResultSearch } from '../hooks/useResultSearch'
import { DEFAULT_DAYS_BACK, daysSuffix, daysSummary } from '../utils/daysBack'
import { useSpeciesName } from '../hooks/useSpeciesName'
import SpeciesDropdown from './SpeciesDropdown'
import NotableToggle from './filters/NotableToggle'
import SearchBox from './filters/SearchBox'
import ResultSummary from './filters/ResultSummary'
import SegmentedPicker from './filters/SegmentedPicker'
import DaysPicker from './filters/DaysPicker'
import FilterBar from './filters/FilterBar'
import { DISTANCES_KM } from '../utils/geo'
import ObservationResults from './ObservationResults'
import LoadingMessage from './LoadingMessage'

const DISTANCE_OPTIONS = DISTANCES_KM.map(km => ({ value: km, label: `${km} km` }))

// The visitor's rounded position for this browser session, so returning to the tab doesn't ask again
let sessionPosition = null

// The Near me page: recent observations within a chosen distance of the visitor
function NearbyView() {
    const { viewType, lastSearch } = useContext(ObservationsContext)
    const [, setSearchParams] = useSearchParams()
    const location = useLocation()

    const [initialFilters] = useState(readNearbyFilters)
    const [dist, setDist] = useState(initialFilters.dist)
    const [daysBack, setDaysBack] = useState(initialFilters.days)
    const [notable, setNotable] = useState(initialFilters.notable)
    const [species, setSpecies] = useState(initialFilters.species ? { speciesCode: initialFilters.species } : '')
    const { filterText, setSearch, clearSearch } = useResultSearch(initialFilters.q)

    // { lat, lng } once known. status: 'checking' | 'prompt' | 'locating' | 'ready' | 'denied' | 'unavailable' | 'error'
    const [position, setPosition] = useState(sessionPosition)
    const [status, setStatus] = useState(sessionPosition ? 'ready' : 'checking')
    // Species seen nearby, from the latest load of all species, for the species dropdown
    const [nearbySpeciesCodes, setNearbySpeciesCodes] = useState(null)

    const locate = useCallback(() => {
        setStatus('locating')
        getRoundedPosition()
            .then(found => {
                sessionPosition = found
                setPosition(found)
                setStatus('ready')
            })
            .catch(error => setStatus(error.code === 1 ? 'denied' : 'error'))
    }, [])

    // Without a remembered position, locate straight away if permission was already given; otherwise wait for the
    // button, so the browser's permission prompt follows a clear explanation
    useEffect(() => {
        if (sessionPosition) return
        if (!navigator.geolocation) {
            setStatus('unavailable')
            return
        }
        locationPermission().then(permission => {
            if (permission === 'granted') locate()
            else setStatus(permission === 'denied' ? 'denied' : 'prompt')
        })
    }, [locate])

    // Load observations around the position; each gets its distance from the visitor
    const dataKey = position ? `nearby|${position.lat}|${position.lng}|${dist}|${daysBack}|${notable}|${species?.speciesCode ?? ''}` : ''
    useObservationLoader(dataKey, () => fetchObservationsNearby(position, dist, notable, species?.speciesCode, daysBack)
        .then(obs => {
            if (!notable && !species) setNearbySpeciesCodes(new Set(obs.map(o => o.speciesCode)))
            return obs.map(o => ({ ...o, distanceKm: distanceKm(position.lat, position.lng, o.lat, o.lng) }))
        }))

    // Write the filters (never the position) to the URL, and remember them for the header tab
    useEffect(() => {
        setSearchParams(prev => withNearbyFilters(prev, {
            dist, days: daysBack, notable, species: species?.speciesCode, q: filterText, view: viewType,
        }), { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dist, daysBack, notable, species?.speciesCode, filterText, viewType])
    useEffect(() => { lastSearch.current.nearby = filtersOnly(location.search) }, [location.search, lastSearch])

    // Notable sightings and a single species are separate eBird queries, so choosing one clears the other
    const handleNotableToggle = () => {
        setNotable(!notable)
        setSpecies('')
    }
    const handleSpeciesSelect = (selected) => {
        setSpecies(selected)
        if (selected) setNotable(false)
    }

    // What the collapsed filter bar shows, e.g. "25 km · Notable · Last 3 days"
    const speciesName = useSpeciesName(species)
    const summary = [`${dist} km`, speciesName, notable && 'Notable', daysBack !== DEFAULT_DAYS_BACK && daysSummary(daysBack),
        filterText && `"${filterText}"`].filter(Boolean).join(' · ')

    // "Clear filters" keeps the distance, which is part of where to look rather than a filter
    const hasActiveFilters = Boolean(species || notable || filterText || daysBack !== DEFAULT_DAYS_BACK)
    const handleClearFilters = () => {
        setSpecies('')
        setNotable(false)
        setDaysBack(DEFAULT_DAYS_BACK)
        clearSearch()
    }

    return (
        <>
            <FilterBar
                summary={summary}
                footer={status === 'ready' && (
                    <ResultSummary
                        dataKey={dataKey}
                        searching={Boolean(filterText)}
                        notable={notable}
                        suffix={` within ${dist} km${daysSuffix(daysBack)}`}
                        onClear={hasActiveFilters ? handleClearFilters : undefined}
                    />
                )}
            >
                <div className="filter-group">
                    <span className="filter-group-label">Distance</span>
                    <div className="filter-group-controls">
                        <SegmentedPicker options={DISTANCE_OPTIONS} value={dist} onChange={setDist} label="Search radius"/>
                    </div>
                </div>
                <div className="filter-group">
                    <span className="filter-group-label">Species</span>
                    <div className="filter-group-controls">
                        <SpeciesDropdown selected={species} onSelect={handleSpeciesSelect} speciesCodes={nearbySpeciesCodes}/>
                        <NotableToggle notable={notable} onToggle={handleNotableToggle}/>
                    </div>
                </div>
                <DaysPicker value={daysBack} onChange={setDaysBack}/>
                <SearchBox value={filterText} onChange={setSearch}/>
            </FilterBar>
            {status === 'ready' ? (
                <ObservationResults
                    dataKey={dataKey}
                    emptyMessage={`no birds reported within ${dist} km${daysSuffix(daysBack)} 😔 try a larger distance or longer time`}
                    searchArea={{ ...position, radiusKm: dist }}
                />
            ) : (
                <LocationPrompt status={status} onLocate={locate}/>
            )}
        </>
    )
}

// Explains the location request, or why it can't be used, in place of the results
// eslint-disable-next-line react/prop-types
function LocationPrompt({ status, onLocate }) {
    if (status === 'checking' || status === 'locating') return <LoadingMessage text="finding your location..."/>

    const exploreLink = <Link to="/observations">browse by region</Link>
    const messages = {
        prompt: <>Share your location to see birds reported near you recently. It&apos;s rounded to about 1 km and never saved.</>,
        denied: <>Location access is off for this site. Turn it on in your browser&apos;s settings, or {exploreLink} instead.</>,
        unavailable: <>This browser can&apos;t share its location. You can {exploreLink} instead.</>,
        error: <>Your location couldn&apos;t be found just now. Try again, or {exploreLink} instead.</>,
    }

    return (
        <section className="loading location-prompt">
            <h4>Birds near you</h4>
            <p>{messages[status]}</p>
            {(status === 'prompt' || status === 'error') && (
                <button type="button" className="location-button" onClick={onLocate}>
                    {status === 'error' ? 'Try again' : 'Use my location'}
                </button>
            )}
        </section>
    )
}

export default NearbyView
