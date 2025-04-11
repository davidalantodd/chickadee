/* eslint-disable react/display-name */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useContext, useEffect, useState, useMemo } from 'react'
import { Dropdown, Form } from 'react-bootstrap'
import { FixedSizeList as List } from 'react-window'
import { ObservationsContext } from '../contexts/ObservationsContext'
import debounce from 'lodash/debounce'

function SpeciesDropdown() {
    const { currentSpecies, setCurrentSpecies, setNotable, taxonomy, filteredTaxonomy, setFilteredTaxonomy, setSpeciesFilter, speciesFilter } = useContext(ObservationsContext)
    const [displayedSpecies, setDisplayedSpecies] = useState(filteredTaxonomy ? filteredTaxonomy.slice(0, 100) : [])
    
    useEffect(() => {
      setDisplayedSpecies(filteredTaxonomy ? filteredTaxonomy : [])
  }, [filteredTaxonomy])

    const handleSpeciesSelect = (species) => {
        setCurrentSpecies(species)
        setNotable(false)
    }

    const CustomSpeciesToggle = React.forwardRef(({ children, onClick }, ref) => (
        <a
          href=""
          ref={ref}
          onClick={(e) => {
            e.preventDefault();
            onClick(e);
          }}
          className="btn btn-primary dropdown-toggle"
        >
          {children}
        </a>
      ));

    // Debounce the filter function to avoid excessive re-renders
      const debouncedFilter = useMemo(() => 
        debounce((value) => {
            const regex = RegExp(value, "gi")
            const filteredTaxTemp = taxonomy.filter((tax) => tax.comName.match(regex))
            setFilteredTaxonomy(filteredTaxTemp)
            setDisplayedSpecies(filteredTaxTemp)
        }, 300), [taxonomy, setFilteredTaxonomy]
    )
      
      const handleFilter = (e) => {
        const value = e.target.value
        setSpeciesFilter(value)
        debouncedFilter(value)
      }

    // Row component for react-window, rendered for each item in the list
      const Row = ({ index, style }) => (
        <div style={style}>
            <Dropdown.Item key={displayedSpecies[index].speciesCode} onClick={() => handleSpeciesSelect(displayedSpecies[index])}>
                {displayedSpecies[index].comName}
            </Dropdown.Item>
        </div>
    );

    // Custom menu component for react-bootstrap dropdown
    const CustomSpeciesMenu = React.forwardRef(
      ({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
        
        return (
          <div
            ref={ref}
            style={style}
            className={className}
            aria-labelledby={labeledBy}
          >
            <Form.Control
              autoFocus
              className="mx-3 my-2 w-auto species-filter-input"
              placeholder="Filter species..."
              onChange={handleFilter}
              value={speciesFilter}
            />
            <Dropdown.Item key={'default'} onClick={() => setCurrentSpecies('')} className='clear-species-selection'>Clear Selection</Dropdown.Item>
            {/* Render the list of species using react-window */}
            <List
              height={280}
              itemCount={displayedSpecies.length}
              itemSize={35}
              width={'100%'}
            >
              {Row}
            </List>
          </div>
        );
      },
    );

    return (
        <Dropdown className='species-dropdown'>
            <Dropdown.Toggle variant="primary" id="dropdown-basic" as={CustomSpeciesToggle} className='dropdown-toggle'>
                {!currentSpecies ? 'Select Species' : currentSpecies.comName}
            </Dropdown.Toggle>
            <Dropdown.Menu className='species-dropdown-menu' as={CustomSpeciesMenu}></Dropdown.Menu>
        </Dropdown>
    )

}

export default SpeciesDropdown