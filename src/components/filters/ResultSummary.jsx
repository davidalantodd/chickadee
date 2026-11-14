/* eslint-disable react/prop-types */
import { useContext } from 'react'
import { ObservationsContext } from '../../contexts/ObservationsContext'

// "115 recent bird observations within 5 km · Clear filters", or "12 of 193 ..." while searching.
// `dataKey` is the page's current query; until its observations arrive, the count reads "Loading…".
export default function ResultSummary({ dataKey, searching, notable, suffix, onClear }) {
    const { observations, filteredObservations, loading } = useContext(ObservationsContext)
    const ready = !loading && observations.key === dataKey
    return (
        <p className="observation-count">
            {!ready ? 'Loading…' : <>
                {searching ? `${filteredObservations.obs.length} of ${observations.obs.length}` : filteredObservations.obs.length}
                {notable ? ' notable' : ' recent'} bird observations{suffix}
            </>}
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
