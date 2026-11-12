import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { observationLink } from '../utils/url'

// Stable function that opens an observation in the modal, keeping the current filters.
// `fromList` tells the modal there is a list entry to go back to when it closes.
export function useOpenObservation() {
    const navigate = useNavigate()
    return useCallback(
        (observation) => navigate(observationLink(observation, window.location.search, window.location.pathname), { state: { fromList: true } }),
        [navigate]
    )
}
