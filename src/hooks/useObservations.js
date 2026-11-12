import { useContext, useEffect } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'

// The most specific region selected: subregion > region > country, or undefined if none is selected
export const mostSpecificRegion = (country, region, subRegion) => [subRegion, region, country].find(r => r.code)

// Loads observations into the shared state whenever `key` changes. `key` names the query (e.g. "US-VA|notable"),
// so the list and map can tell when the loaded observations belong to the current page; an empty key clears them.
// `load` returns a promise of observations. Responses for a key that has since changed are ignored.
export function useObservationLoader(key, load) {
    const { setObservations, setLoading } = useContext(ObservationsContext)

    useEffect(() => {
        if (!key) {
            setObservations({ key: '', obs: [] })
            setLoading(false)
            return
        }
        let cancelled = false
        setLoading(true)
        load().then(obs => {
            if (cancelled) return
            setObservations({ key, obs })
            setLoading(false)
        })
        return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])
}
