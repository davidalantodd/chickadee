/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useContext } from 'react'
import { Dropdown } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext'

function RegionDropdown() {
    const { regions, currentRegion, setCurrentRegion, setCurrentSubRegion } = useContext(ObservationsContext)
    
    const handleRegionSelect = (region) => {
        setCurrentRegion(region) 
        setCurrentSubRegion({code:'',name:''})
    }

    return (
        <Dropdown className='region-dropdown'>
            <Dropdown.Toggle variant="primary" id="dropdown-basic" className='dropdown-toggle' >
                {currentRegion.name ? currentRegion.name : 'Select Region'}
            </Dropdown.Toggle>
            <Dropdown.Menu className='region-dropdown-menu'>
                <Dropdown.Item key={'default'} onClick={()=>handleRegionSelect({code:'', name:''})} className='clear-region-selection'>Clear Selection</Dropdown.Item>
                {regions.map((region) => (
                    <Dropdown.Item key={region.code} onClick={()=>handleRegionSelect(region)}>{region.name}</Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    )

}

export default RegionDropdown