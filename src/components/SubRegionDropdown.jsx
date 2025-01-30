/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useContext } from 'react'
import { Dropdown } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext'

function SubRegionDropdown() {
    const { setCurrentSubRegion, currentSubRegion, subRegions } = useContext(ObservationsContext)

    return (
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
        </Dropdown>
        )
    
    }
    
    export default SubRegionDropdown