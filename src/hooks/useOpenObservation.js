import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { observationLink } from '../utils/url'

// Function that opens an observation in the modal, keeping the current filters. `fromList` tells the modal there
// is a list entry to go back to when it closes.
// The function never changes identity. React Router's navigate changes whenever the URL does, and the map rebuilds
// every marker (closing any open marker popup) when its click handler changes, so the latest navigate is kept in
// a ref instead of being a dependency.
export function useOpenObservation() {
    const navigate = useNavigate()
    const navigateRef = useRef(navigate)
    navigateRef.current = navigate
    return useCallback(
        (observation) => navigateRef.current(observationLink(observation, window.location.search, window.location.pathname), { state: { fromList: true } }),
        []
    )
}
