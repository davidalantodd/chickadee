import { useContext } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import FilterableDropdown from './FilterableDropdown'

function SubRegionDropdown() {
    const { subRegions, currentSubRegion, setCurrentSubRegion } = useContext(ObservationsContext)

    return (
        <FilterableDropdown
            label='Select Sub-Region'
            filterPlaceholder='Filter sub-regions...'
            items={subRegions}
            selected={currentSubRegion}
            onSelect={setCurrentSubRegion}
        />
    )
}

export default SubRegionDropdown
