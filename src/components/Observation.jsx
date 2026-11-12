/* eslint-disable react/prop-types */
import { Card } from 'react-bootstrap'
import { formatDate, formatLocation } from '../utils/format'
import { formatDistance } from '../utils/geo'
import { useOpenObservation } from '../hooks/useOpenObservation'

export default function Observation({observation, index}) {
    const openObservation = useOpenObservation()

    return (
        <Card className={'observation-card' + ((index % 2 === 0) ? " observation-card-shaded" : "")} onClick={() => openObservation(observation)}>
            <Card.Body className="observation-card-body">
                {observation.photo ? (
                    // Shown at 48px, or 96px below 1000px wide where cards stack (see index.css). The two standard
                    // Wikimedia widths cover both sizes on high-DPI screens.
                    <img
                        src={observation.photo.list}
                        srcSet={`${observation.photo.list} 120w, ${observation.photo.popup} 250w`}
                        sizes="(max-width: 1000px) 96px, 48px"
                        className="observation-card-thumb"
                        alt=""
                        title={observation.photo.credit}
                        loading="lazy"
                        width="48"
                        height="48"
                        onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                    />
                ) : (
                    <span className="observation-card-thumb observation-card-thumb-empty" aria-hidden="true"/>
                )}
                <div className="observation-card-text">
                    <Card.Title className="observation-card-title">
                        {observation.comName}
                    </Card.Title>
                    <Card.Text className="observation-card-date">
                        {formatDate(observation.obsDt)}
                    </Card.Text>
                    <Card.Text className="observation-card-location">
                        {formatLocation(observation.locName)}
                        {(observation.area || observation.distanceKm !== undefined) && (
                            <span className="observation-card-area">
                                {[observation.distanceKm !== undefined && formatDistance(observation.distanceKm),
                                  observation.area && `near ${observation.area}`].filter(Boolean).join(' · ')}
                            </span>
                        )}
                    </Card.Text>
                </div>
            </Card.Body>
        </Card>
    )
}
