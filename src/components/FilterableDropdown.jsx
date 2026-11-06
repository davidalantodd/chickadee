/* eslint-disable react/prop-types */
import { useRef, useState } from 'react'
import { Dropdown, Form } from 'react-bootstrap'

// Dropdown of {code, name} regions with a text box at the top to narrow the list.
// The lists are small, so they're filtered on every keystroke without debouncing.
function FilterableDropdown({ label, filterPlaceholder, items, selected, onSelect }) {
    const [filter, setFilter] = useState('')
    const inputRef = useRef(null)

    const shownItems = items.filter((item) => item.name.toLowerCase().includes(filter.toLowerCase()))

    // Focus the filter box when the menu opens, and start fresh the next time it opens
    const handleToggle = (isOpen) => {
        if (isOpen) setTimeout(() => inputRef.current?.focus())
        else setFilter('')
    }

    return (
        <Dropdown className='region-dropdown' onToggle={handleToggle}>
            <Dropdown.Toggle variant="light" className={`dropdown-toggle filter-pill ${selected.name ? '' : 'is-empty'}`}>
                {selected.name || label}
            </Dropdown.Toggle>
            <Dropdown.Menu className='region-dropdown-menu'>
                <div className='dropdown-sticky-header'>
                    <div className='region-filter'>
                        <Form.Control
                            ref={inputRef}
                            className="species-filter-input"
                            placeholder={filterPlaceholder}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <Dropdown.Item onClick={() => onSelect({code:'', name:''})} className='clear-region-selection'>Clear Selection</Dropdown.Item>
                </div>
                {shownItems.map((item) => (
                    <Dropdown.Item key={item.code} onClick={() => onSelect(item)}>{item.name}</Dropdown.Item>
                ))}
                {shownItems.length === 0 ? <Dropdown.ItemText className='clear-region-selection'>No matches</Dropdown.ItemText> : null}
            </Dropdown.Menu>
        </Dropdown>
    )
}

export default FilterableDropdown
