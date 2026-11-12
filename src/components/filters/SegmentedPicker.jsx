/* eslint-disable react/prop-types */

// A row of mutually exclusive choices, e.g. "5 · 10 · 25 · 50 km" or "1 · 3 · 7 · 14 · 30 days".
// `options` is a list of { value, label }.
export default function SegmentedPicker({ options, value, onChange, label }) {
    return (
        <div className="segmented-picker" role="radiogroup" aria-label={label}>
            {options.map(option => (
                <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={option.value === value}
                    className={`segmented-option ${option.value === value ? 'active' : ''}`}
                    onClick={() => onChange(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}
