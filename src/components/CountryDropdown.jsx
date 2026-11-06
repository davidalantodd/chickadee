import { useContext } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import FilterableDropdown from './FilterableDropdown'

function CountryDropdown() {
    const { countries, currentCountry, setCurrentCountry, setCurrentRegion, setCurrentSubRegion } = useContext(ObservationsContext)

    const handleCountrySelect = (country) => {
        setCurrentCountry(country)
        setCurrentRegion({code:'', name:''})
        setCurrentSubRegion({code:'', name:''})
    }

    return (
        <FilterableDropdown
            label='Select country'
            filterPlaceholder='Filter countries...'
            items={countries}
            selected={currentCountry}
            onSelect={handleCountrySelect}
        />
    )
}

export default CountryDropdown
