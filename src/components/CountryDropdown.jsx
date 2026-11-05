/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useContext } from 'react'
import { Dropdown } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext'

function CountryDropdown() {
    const { countries, currentCountry, setCurrentCountry, setCurrentRegion, setCurrentSubRegion } = useContext(ObservationsContext)

    const handleCountrySelect = (country) => {
        setCurrentCountry(country)
        setCurrentRegion({code:'', name:''})
        setCurrentSubRegion({code:'', name:''})
    }

    return (
        <Dropdown className='region-dropdown'>
            <Dropdown.Toggle variant="primary" id="dropdown-basic" className='dropdown-toggle'>
                {currentCountry.name ? currentCountry.name : 'Select Country'}
            </Dropdown.Toggle>
            <Dropdown.Menu className='region-dropdown-menu'>
                <Dropdown.Item key={'default'} onClick={()=>handleCountrySelect({code:'', name:''})} className='clear-region-selection'>Clear Selection</Dropdown.Item>
                {countries.map((country) => (
                    <Dropdown.Item key={country.code} onClick={()=>handleCountrySelect(country)}>{country.name}</Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    )

}

export default CountryDropdown
