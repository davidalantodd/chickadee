/* eslint-disable react/prop-types */
import { useContext, useMemo, useRef, useState } from 'react'
import { Dropdown, Form } from 'react-bootstrap'
import { FixedSizeList as List } from 'react-window'
import { ObservationsContext } from '../contexts/ObservationsContext'

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
    const { currentSpecies, setCurrentSpecies, setNotable, taxonomy } = useContext(ObservationsContext)
    const [filter, setFilter] = useState('')
    const inputRef = useRef(null)

    const shownSpecies = useMemo(
        () => taxonomy.filter((species) => species.comName.toLowerCase().includes(filter.toLowerCase())),
        [taxonomy, filter]
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
            <Dropdown.Toggle variant="primary" className='dropdown-toggle'>
                {currentSpecies ? currentSpecies.comName : 'Select Species'}
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
