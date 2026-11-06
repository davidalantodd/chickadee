/* eslint-disable react/prop-types */
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Dropdown, Form } from 'react-bootstrap'
import { FixedSizeList as List } from 'react-window'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { mostSpecificRegion } from '../hooks/useObservations'
import { fetchObservationsByRegion, fetchSpeciesList } from '../utils/api'

// Codes of the species seen in a region in the last 30 days (eBird returns each species' latest sighting),
// or of every species ever recorded there
const fetchRegionSpeciesCodes = (regionCode, allTime) => allTime
    ? fetchSpeciesList(regionCode)
    : fetchObservationsByRegion(regionCode, false, undefined).then(obs => obs.map(o => o.speciesCode))

// One row of the virtualized species list; react-window passes the shown species and select handler as `data`
const SpeciesRow = ({ index, style, data }) => {
    const species = data.species[index]
    return (
        <div style={style}>
            <Dropdown.Item onClick={() => data.onSelect(species)}>{species.comName}</Dropdown.Item>
        </div>
    )
}

// Same behavior as FilterableDropdown, but the taxonomy has ~11k species, so only the visible rows are rendered
function SpeciesDropdown() {
    const { currentSpecies, setCurrentSpecies, setNotable, taxonomy,
        currentCountry, currentRegion, currentSubRegion } = useContext(ObservationsContext)
    const [filter, setFilter] = useState('')
    // Whether to offer every species ever recorded in the region, rather than just those seen recently
    const [allTime, setAllTime] = useState(false)
    // Codes of the species offered for the selected region, or null to offer the whole taxonomy
    const [regionSpeciesCodes, setRegionSpeciesCodes] = useState(null)
    const inputRef = useRef(null)

    const regionCode = mostSpecificRegion(currentCountry, currentRegion, currentSubRegion)?.code

    // Refetch the region's species when the region or all-time switch changes, ignoring stale responses.
    // The previous list stays up until the new one arrives; a failed fetch (empty list) falls back to every species.
    useEffect(() => {
        if (!regionCode) {
            setRegionSpeciesCodes(null)
            return
        }
        let cancelled = false
        fetchRegionSpeciesCodes(regionCode, allTime)
            .then(codes => { if (!cancelled) setRegionSpeciesCodes(codes.length ? new Set(codes) : null) })
        return () => { cancelled = true }
    }, [regionCode, allTime])

    const shownSpecies = useMemo(
        () => taxonomy.filter((species) =>
            (!regionSpeciesCodes || regionSpeciesCodes.has(species.speciesCode)) &&
            species.comName.toLowerCase().includes(filter.toLowerCase())),
        [taxonomy, regionSpeciesCodes, filter]
    )

    const handleSpeciesSelect = (species) => {
        setCurrentSpecies(species)
        setNotable(false)
    }

    // Focus the filter box when the menu opens, and start fresh the next time it opens
    const handleToggle = (isOpen) => {
        if (isOpen) setTimeout(() => inputRef.current?.focus())
        else setFilter('')
    }

    return (
        <Dropdown className='species-dropdown' onToggle={handleToggle}>
            <Dropdown.Toggle variant="light" className={`dropdown-toggle filter-pill ${currentSpecies ? '' : 'is-empty'}`}>
                {currentSpecies ? currentSpecies.comName : 'All species'}
            </Dropdown.Toggle>
            <Dropdown.Menu className='species-dropdown-menu'>
                <div className='region-filter'>
                    <Form.Control
                        ref={inputRef}
                        className="species-filter-input"
                        placeholder="Filter species..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                    {regionCode ? (
                        <Form.Check
                            type="switch"
                            id="all-time-species-switch"
                            className="all-time-species-switch"
                            label="Include species not seen recently"
                            title="Off: species seen in the last 30 days. On: every species ever recorded in this region."
                            checked={allTime}
                            onChange={() => setAllTime(!allTime)}
                        />
                    ) : null}
                </div>
                <Dropdown.Item onClick={() => setCurrentSpecies('')} className='clear-species-selection'>Clear Selection</Dropdown.Item>
                {shownSpecies.length > 0 ? (
                    <List
                        height={Math.min(280, shownSpecies.length * 35)}
                        itemCount={shownSpecies.length}
                        itemSize={35}
                        itemData={{ species: shownSpecies, onSelect: handleSpeciesSelect }}
                        width={'100%'}
                    >
                        {SpeciesRow}
                    </List>
                ) : (
                    <Dropdown.ItemText className='clear-species-selection'>No matches</Dropdown.ItemText>
                )}
            </Dropdown.Menu>
        </Dropdown>
    )
}

export default SpeciesDropdown
