/* eslint-disable react/display-name */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useContext } from 'react'
import { Dropdown, Form } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext'

function SpeciesDropdown() {
    const { currentSpecies, setCurrentSpecies, setNotable, taxonomy, filteredTaxonomy, setFilteredTaxonomy, setSpeciesFilter, speciesFilter } = useContext(ObservationsContext)
    
    
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
      
      const handleFilter = (e) => {
        setSpeciesFilter(e.target.value)
        const regex = RegExp(e.target.value, "gi")
        const filteredTaxTemp = taxonomy.filter((tax) => tax.comName.match(regex))
        setFilteredTaxonomy(filteredTaxTemp)
      }

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
                className="mx-3 my-2 w-auto"
                placeholder="Type to filter..."
                onChange={handleFilter}
                value={speciesFilter}
              />
              <ul className="list-unstyled">
                {children}
              </ul>
            </div>
          );
        },
      );

    return (
        <Dropdown className='species-dropdown'>
            <Dropdown.Toggle variant="primary" id="dropdown-basic" as={CustomSpeciesToggle}>
                {!currentSpecies ? 'Select Species' : currentSpecies.comName}
            </Dropdown.Toggle>
            <Dropdown.Menu className='species-dropdown-menu' as={CustomSpeciesMenu}>
                <Dropdown.Item key={'default'} onClick={()=>setCurrentSpecies('')}>Clear Selection</Dropdown.Item>
                {(filteredTaxonomy) ? (filteredTaxonomy.map((species, idx) => (
                    (idx < 100) ? (
                        <Dropdown.Item key={species.speciesCode} onClick={()=>handleSpeciesSelect(species)}>{species.comName}</Dropdown.Item>
                    ) : null)))
                : null}
            </Dropdown.Menu>
        </Dropdown>
    )

}

export default SpeciesDropdown