/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useContext } from 'react'
import { Dropdown } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext'

function RegionDropdown() {
    const { regionsInUS, currentRegion, setCurrentRegion, setCurrentSubRegion } = useContext(ObservationsContext)
    
    const handleRegionSelect = (region) => {
        setCurrentRegion(region) 
        setCurrentSubRegion({code:'',name:''})
    }

    return (
        <Dropdown className='region-dropdown'>
            <Dropdown.Toggle variant="primary" id="dropdown-basic" className='dropdown-toggle' >
                {currentRegion.name !== 'United States' ? currentRegion.name : 'Select State'}
            </Dropdown.Toggle>
            <Dropdown.Menu className='region-dropdown-menu'>
                <Dropdown.Item key={'default'} onClick={()=>setCurrentRegion({code:'US',name:'United States'})} className='clear-region-selection'>Clear Selection</Dropdown.Item>
                {regionsInUS.map((region) => (
                    <Dropdown.Item key={region.code} onClick={()=>handleRegionSelect(region)}>{region.name}</Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    )

}

export default RegionDropdown