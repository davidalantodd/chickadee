import { useEffect, useState } from 'react'
import { fetchObservationsByRegion, fetchSpeciesList } from '../utils/api'

// Codes of the species to offer in the species dropdown for a region: those seen in the last `daysBack` days
// (eBird returns each species' latest sighting), or every species ever recorded there. Null offers the whole taxonomy,
// which is also the fallback when the request fails. The previous set stays up until the new one arrives.
export function useRegionSpeciesCodes(regionCode, allTime, daysBack) {
    const [codes, setCodes] = useState(null)

    useEffect(() => {
        if (!regionCode) {
            setCodes(null)
            return
        }
        let cancelled = false
        const request = allTime
            ? fetchSpeciesList(regionCode)
            : fetchObservationsByRegion(regionCode, false, undefined, daysBack).then(obs => obs.map(o => o.speciesCode))
        request.then(result => { if (!cancelled) setCodes(result.length ? new Set(result) : null) })
        return () => { cancelled = true }
    }, [regionCode, allTime, daysBack])

    return codes
}
