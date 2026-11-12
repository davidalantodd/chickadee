/* eslint-disable react/prop-types */
import { useContext } from 'react'
import { ObservationsContext } from '../../contexts/ObservationsContext'

// "193 recent bird observations within 25 km · Clear filters", or "12 of 193 ..." while searching
export default function ResultSummary({ searching, notable, suffix, onClear }) {
    const { observations, filteredObservations } = useContext(ObservationsContext)
    return (
        <p className="observation-count">
            {searching ? `${filteredObservations.obs.length} of ${observations.obs.length}` : filteredObservations.obs.length}
            {notable ? ' notable' : ' recent'} bird observations{suffix}
            {onClear && (
                <>
                    {' · '}
                    <button type="button" className="clear-filters-button" onClick={onClear}>
                        Clear filters
                    </button>
                </>
            )}
        </p>
    )
}
