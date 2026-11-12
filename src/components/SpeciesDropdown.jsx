/* eslint-disable react/prop-types */
import { useContext, useMemo, useRef, useState } from 'react'
import { Dropdown, Form } from 'react-bootstrap'
import { FixedSizeList as List } from 'react-window'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { useSpeciesName } from '../hooks/useSpeciesName'

// One row of the virtualized species list; react-window passes the shown species and select handler as `data`
const SpeciesRow = ({ index, style, data }) => {
    const species = data.species[index]
    return (
        <div style={style}>
            <Dropdown.Item onClick={() => data.onSelect(species)}>{species.comName}</Dropdown.Item>
        </div>
    )
}

// Same behavior as FilterableDropdown, but the taxonomy has ~11k species, so only the visible rows are rendered.
// `selected` is a species ({ speciesCode, comName? }) or ''; `onSelect` receives a species, or '' to clear.
// `speciesCodes` limits the choices (null offers every species). Passing `onAllTimeChange` adds the switch for
// including species not seen recently, with `allTime` as its state.
function SpeciesDropdown({ selected, onSelect, speciesCodes, allTime, onAllTimeChange }) {
    const { taxonomy } = useContext(ObservationsContext)
    const [filter, setFilter] = useState('')
    const inputRef = useRef(null)

    const selectedName = useSpeciesName(selected)

    const shownSpecies = useMemo(
        () => taxonomy.filter((species) =>
            (!speciesCodes || speciesCodes.has(species.speciesCode)) &&
            species.comName.toLowerCase().includes(filter.toLowerCase())),
        [taxonomy, speciesCodes, filter]
    )

    // Focus the filter box when the menu opens, and start fresh the next time it opens
    const handleToggle = (isOpen) => {
        if (isOpen) setTimeout(() => inputRef.current?.focus())
        else setFilter('')
    }

    return (
        <Dropdown className='species-dropdown' onToggle={handleToggle}>
            <Dropdown.Toggle variant="light" className={`dropdown-toggle filter-pill ${selected ? '' : 'is-empty'}`}>
                {selectedName || 'All species'}
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
                    {onAllTimeChange ? (
                        <Form.Check
                            type="switch"
                            id="all-time-species-switch"
                            className="all-time-species-switch"
                            label="Include species not seen recently"
                            title="Off: species seen in the last 30 days. On: every species ever recorded in this region."
                            checked={allTime}
                            onChange={() => onAllTimeChange(!allTime)}
                        />
                    ) : null}
                </div>
                <Dropdown.Item onClick={() => onSelect('')} className='clear-species-selection'>Clear Selection</Dropdown.Item>
                {shownSpecies.length > 0 ? (
                    <List
                        height={Math.min(280, shownSpecies.length * 35)}
                        itemCount={shownSpecies.length}
                        itemSize={35}
                        itemData={{ species: shownSpecies, onSelect }}
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
