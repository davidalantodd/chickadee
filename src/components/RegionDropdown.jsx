import { useContext } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import FilterableDropdown from './FilterableDropdown'

function RegionDropdown() {
    const { regions, currentRegion, setCurrentRegion, setCurrentSubRegion } = useContext(ObservationsContext)

    const handleRegionSelect = (region) => {
        setCurrentRegion(region)
        setCurrentSubRegion({code:'', name:''})
    }

    return (
        <FilterableDropdown
            label='All regions'
            filterPlaceholder='Filter regions...'
            items={regions}
            selected={currentRegion}
            onSelect={handleRegionSelect}
        />
    )
}

export default RegionDropdown
