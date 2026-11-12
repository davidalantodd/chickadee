/* eslint-disable react/prop-types */
import { useContext, useId } from 'react'
import { ObservationsContext } from '../../contexts/ObservationsContext'

// Both pages' filter bar: the controls (`children`), then the result count (`footer`). On phones a "Filters"
// button above them opens and closes the controls; closed, it summarises what's active, e.g. "Virginia ·
// Carolina Chickadee · Last 7 days". On wider screens the button is hidden and the controls always show (see
// .filter-toggle in index.css). Open or closed is shared by both pages, so it stays as chosen between them.
export default function FilterBar({ summary, footer, children }) {
    const { filtersOpen, setFiltersOpen } = useContext(ObservationsContext)
    const controlsId = useId()

    return (
        <section className="filter-bar">
            <button
                type="button"
                className="filter-toggle"
                aria-expanded={filtersOpen}
                aria-controls={controlsId}
                onClick={() => setFiltersOpen(!filtersOpen)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" className="filter-toggle-icon">
                    <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z"/>
                </svg>
                <span className="filter-toggle-label">Filters</span>
                {!filtersOpen && summary && <span className="filter-toggle-summary">{summary}</span>}
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"
                    className={`filter-toggle-chevron ${filtersOpen ? 'open' : ''}`}>
                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                </svg>
            </button>
            {/* Kept mounted while closed so dropdowns don't reset. A class rather than the hidden attribute, since
                Bootstrap would force hidden on wider screens too, where the controls always show. */}
            <div id={controlsId} className={`filter-row ${filtersOpen ? '' : 'is-collapsed'}`}>
                {children}
            </div>
            <div className="filter-bar-status">
                {footer}
            </div>
        </section>
    )
}
