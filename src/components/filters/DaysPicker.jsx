/* eslint-disable react/prop-types */
import { Dropdown } from 'react-bootstrap'
import { DAYS_BACK, DEFAULT_DAYS_BACK, daysSummary } from '../../utils/daysBack'

// How many days back to show observations from, for both pages' filter bars: a "Last 3 days" dropdown in the
// same style as the region and species dropdowns. The default reads as unset, like those do.
export default function DaysPicker({ value, onChange }) {
    return (
        <div className="filter-group">
            <span className="filter-group-label">Time</span>
            <div className="filter-group-controls">
                <Dropdown className="days-dropdown">
                    <Dropdown.Toggle variant="light" className={`dropdown-toggle filter-pill ${value === DEFAULT_DAYS_BACK ? 'is-empty' : ''}`}>
                        {daysSummary(value)}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {DAYS_BACK.map(days => (
                            <Dropdown.Item key={days} active={days === value} onClick={() => onChange(days)}>
                                {daysSummary(days)}
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    )
}
