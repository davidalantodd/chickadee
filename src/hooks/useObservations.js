import { useContext, useEffect } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { fetchObservationsByRegion } from '../utils/api'

// Fetch observations for the most specific selected region whenever the filters change.
// onLoaded runs after each successful load (e.g. to reset pagination).
export function useObservations(onLoaded) {
    const { currentCountry, currentRegion, currentSubRegion,
        notable, currentSpecies,
        setObservations, setLoading } = useContext(ObservationsContext)

    useEffect(() => {
        // Search the most specific region selected: subregion > region > country
        const regionToSearch = [currentSubRegion, currentRegion, currentCountry].find(region => region.code)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCountry, currentRegion, currentSubRegion, notable, currentSpecies])
}
