/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import Observations from './Observations'
import { useEffect, useContext } from 'react'
import React from 'react'
import { Form } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { fetchRegionsInUS, fetchSubRegions, fetchTaxonomy } from '../utils/api'
import RegionDropdown from './RegionDropdown'
import SpeciesDropdown from './SpeciesDropdown'
import SubRegionDropdown from './SubRegionDropdown'

function ObservationView() {
    const {setRegionsInUS, currentRegion,setSubRegions,
        observations, notable, setNotable, setTaxonomy,
        setCurrentSpecies, filteredTaxonomy, setFilteredTaxonomy,
        singleObsView} = useContext(ObservationsContext);


    const handleNotableSwitch = () => {
        setNotable(!notable)
        setCurrentSpecies('')
    }
      
    useEffect(() => {
        fetchRegionsInUS()
            .then(data => setRegionsInUS(data));
        fetchTaxonomy()
            .then(data => {
                data.sort((a,b) => a.comName.localeCompare(b.comName))
                setTaxonomy(data)
                if (!filteredTaxonomy){
                    setFilteredTaxonomy(data)
                }
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (currentRegion.code) {
            fetchSubRegions(currentRegion)
                .then(data => {setSubRegions(data)});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRegion])

    return (
        <>
            {/* Render the filter bar only if there are observations */}
            {(singleObsView === -1) ? (
                <section className="filter-bar">
                    <span className="filter-dropdowns">
                        <h5>Filter observations</h5>
                        <RegionDropdown/>
                        {(currentRegion.code !== 'US') ? (
                            <SubRegionDropdown/>
                        ) : null}
                        <SpeciesDropdown />
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
            {/* Render the observations */}
            <Observations className="observations-component"/>
        </>
    )
}


export default ObservationView