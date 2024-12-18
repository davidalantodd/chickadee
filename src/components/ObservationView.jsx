/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import Observations from './Observations'
import { useEffect, useContext } from 'react'
import React from 'react'
import { Dropdown, Form } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext'

function ObservationView() {
    const {regionsInUS, setRegionsInUS,
        currentRegion, setCurrentRegion,
        subRegions, setSubRegions,
        observations,
        currentSubRegion, setCurrentSubRegion,
        notable, setNotable,
        taxonomy, setTaxonomy,
        currentSpecies, setCurrentSpecies,
        filteredTaxonomy, setFilteredTaxonomy,
        speciesFilter, setSpeciesFilter,
        singleObsView} = useContext(ObservationsContext);

        

    const fetchRegionsInUS = async () => {
        await fetch('/.netlify/functions/fetchRegionsInUS')
            .then(response => response.json())
            .then(data => setRegionsInUS(data))
            .catch(error => {
                console.error('Error fetching regions:', error);
            });
    }

    const fetchSubRegions = async () => {
        await fetch(`/.netlify/functions/fetchSubRegions?currentRegion=${currentRegion.code}`)
            .then(response => response.json())
            .then(data => {setSubRegions(data)})
            .catch(error => {
                console.error('Error fetching subregions:', error);
            });
    }

    const fetchTaxonomy = async () => {
        await fetch('/.netlify/functions/fetchTaxonomy')
        .then(response => response.json())
        .then(data => {
            data.sort((a,b) => a.comName.localeCompare(b.comName))
            setTaxonomy(data)
            if (!filteredTaxonomy){
                setFilteredTaxonomy(data)
            }
        });
    }

    const handleRegionSelect = (region) => {
        setCurrentRegion(region) 
        setCurrentSubRegion({code:'',name:''})
    } 

    const handleSpeciesSelect = (species) => {
        setCurrentSpecies(species)
        setNotable(false)
    }

    const handleNotableSwitch = () => {
        setNotable(!notable)
        setCurrentSpecies('')
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
      
    useEffect(() => {
        fetchRegionsInUS();
        fetchSubRegions();
        fetchTaxonomy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRegion]);

    return (
        <>
            {(singleObsView === -1) ? (
                <section className="filter-bar">
                    <span className="filter-dropdowns">
                        <h5>Filter observations</h5>
                        <Dropdown className='region-dropdown'>
                            <Dropdown.Toggle variant="primary" id="dropdown-basic">
                                {currentRegion.name !== 'United States' ? currentRegion.name : 'Select State'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className='region-dropdown-menu'>
                                <Dropdown.Item key={'default'} onClick={()=>setCurrentRegion({code:'US',name:'United States'})}>Clear Selection</Dropdown.Item>
                                {regionsInUS.map((region) => (
                                    <Dropdown.Item key={region.code} onClick={()=>handleRegionSelect(region)}>{region.name}</Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                        {(currentRegion.code !== 'US') ?  (
                        <Dropdown className='region-dropdown'>
                            <Dropdown.Toggle variant="primary" id="dropdown-basic">
                                {currentSubRegion.name ? currentSubRegion.name : 'Select Sub-Region'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className='region-dropdown-menu'>
                                <Dropdown.Item key={'default'} onClick={()=>setCurrentSubRegion({code:'',name:''})}>Clear Selection</Dropdown.Item>
                                {subRegions.map((region) => (
                                    <Dropdown.Item key={region.code} onClick={()=>setCurrentSubRegion(region)}>{region.name}</Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>) : null}
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
                        <Form className='notable-switch'>
                            <Form.Check
                                type="switch"
                                id="custom-switch"
                                label="Notable Observations"
                                checked={notable}
                                onChange={() => handleNotableSwitch(!notable)}
                            />
                        </Form>
                    </span>
                    {(singleObsView === -1) ? (<h5>{observations.obs.length} recent bird observations</h5>) : null}
                </section>
            ) : null}
            <Observations className="observations-component"/>
        </>
    )
}


export default ObservationView