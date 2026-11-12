import { useContext, useMemo } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'

// Display name of a selected species ({ speciesCode, comName? }), looked up by code since a species read from the
// URL has no name. The code stands in until the taxonomy loads; '' when nothing is selected.
export function useSpeciesName(selected) {
    const { taxonomy } = useContext(ObservationsContext)
    return useMemo(
        () => (selected ? taxonomy.find(species => species.speciesCode === selected.speciesCode)?.comName || selected.speciesCode : ''),
        [taxonomy, selected]
    )
}
