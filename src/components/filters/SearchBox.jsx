/* eslint-disable react/prop-types */
import { Form } from 'react-bootstrap'

// "Search these results" box, which narrows the loaded observations by bird name
export default function SearchBox({ value, onChange }) {
    return (
        <div className="filter-group filter-search">
            <Form.Control
                id="observation-filter-input"
                type="search"
                placeholder="Search these results..."
                aria-label="Search these results by bird name"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}
