/* eslint-disable react/prop-types */
import { DISTANCES_KM } from '../../utils/geo'

// "5 · 10 · 25 · 50 km" segmented choice of search radius for the Near me page
export default function DistancePicker({ value, onChange }) {
    return (
        <div className="distance-picker" role="radiogroup" aria-label="Search radius">
            {DISTANCES_KM.map(km => (
                <button
                    key={km}
                    type="button"
                    role="radio"
                    aria-checked={km === value}
                    className={`distance-option ${km === value ? 'active' : ''}`}
                    onClick={() => onChange(km)}
                >
                    {km} km
                </button>
            ))}
        </div>
    )
}
