import { useContext, useEffect } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { fetchObservationsByRegion } from '../utils/api'

// The most specific region selected: subregion > region > country, or undefined if none is selected
export const mostSpecificRegion = (country, region, subRegion) => [subRegion, region, country].find(r => r.code)

// Fetch observations for the most specific selected region whenever the filters change.
// onLoaded runs after each successful load (e.g. to reset pagination).
export function useObservations(onLoaded) {
    const { currentCountry, currentRegion, currentSubRegion,
        notable, currentSpecies,
        setObservations, setLoading } = useContext(ObservationsContext)

    useEffect(() => {
        const regionToSearch = mostSpecificRegion(currentCountry, currentRegion, currentSubRegion)
        if (!regionToSearch) {
            setObservations({ region: '', obs: [] })
            setLoading(false)
            return
        }

        // Ignore responses for filters that have since changed
        let cancelled = false
        setLoading(true)
        fetchObservationsByRegion(regionToSearch.code, notable, currentSpecies.speciesCode)
            .then(obs => {
                if (cancelled) return
                setObservations({ region: regionToSearch.code, obs })
                setLoading(false)
                if (onLoaded) onLoaded()
            })
        return () => { cancelled = true }
    // Keyed on codes: the fetch reruns only when the query itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCountry.code, currentRegion.code, currentSubRegion.code, notable, currentSpecies.speciesCode])
}
