/* eslint-disable react/prop-types */
import { Card } from 'react-bootstrap'
import { formatDate, formatLocation } from '../utils/format'
import { useOpenObservation } from '../hooks/useOpenObservation'

export default function Observation({observation, index}) {
    const openObservation = useOpenObservation()

    return (
        <Card className={'observation-card' + ((index % 2 === 0) ? " observation-card-shaded" : "")} onClick={() => openObservation(observation)}>
            <Card.Body className="observation-card-body">
                <Card.Title className="observation-card-title">
                    {observation.comName}
                </Card.Title>
                <Card.Text className="observation-card-date">
                    {formatDate(observation.obsDt)}
                </Card.Text>
                <Card.Text className="observation-card-location">
                    {formatLocation(observation.locName)}
                </Card.Text>
            </Card.Body>
        </Card>
    )
}
