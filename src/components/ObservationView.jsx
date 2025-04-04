/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import Observations from './Observations'
import { useEffect, useContext, useState } from 'react'
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
        singleObsView, filteredObservations, setFilteredObservations} = useContext(ObservationsContext);

    const [filterText, setFilterText] = useState('');

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

    useEffect(() => {
        // Filter observations based on the filter text
        const filteredObs = observations.obs.filter((observation) =>
            observation.comName.toLowerCase().includes(filterText.toLowerCase())
        );
        setFilteredObservations({
            ...filteredObservations,
            obs: filteredObs,
        });
    }, [filterText, observations.obs]);

    console.log(filteredObservations)

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
                        {/* Input box for filtering */}
                        <Form className="filter-input">
                            <Form.Control
                                type="text"
                                placeholder="Search observations..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
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