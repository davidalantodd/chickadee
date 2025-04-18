/* eslint-disable react/prop-types */
import { Card } from 'react-bootstrap'
import { useContext } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import SingleObservationView from './SingleObservationView'
import { formatDate, formatLocation } from '../utils/format'
import { useNavigate } from 'react-router-dom';

export default function Observation({observation, index}) {
    const { singleObsView } = useContext(ObservationsContext)
    const navigate = useNavigate();

    // Function to navigate to the SingleObservationView
    const handleSingleObsView = () => {
        // Save current scroll position before navigating
        localStorage.setItem('scrollPosition', window.scrollY.toString());
        navigate(`/observations/${observation.subId}?code=${observation.speciesCode}&commonName=${observation.comName}&location=${observation.locName}&date=${observation.obsDt}&lat=${observation.lat}&lng=${observation.lng}`);
    }
    
    return (
        <>
            {/* If singleObsView is -1, show the observation card. Otherwise, show the SingleObservationView */}
            {singleObsView === -1 ?  (
                <Card className={'observation-card' + ((index % 2 === 0) ? " observation-card-shaded" : "")} onClick={handleSingleObsView}>
                    <Card.Body className="observation-card-body">
                        <Card.Title className="observation-card-title">
                            {observation.comName}
                        </Card.Title>
                        <Card.Text className="observation-card-date">
                            {formatDate(observation.obsDt)}
                        </Card.Text>
                        <Card.Text className="observation-card-location">
                            {formatLocation(observation.locName, singleObsView)}
                        </Card.Text>
                    </Card.Body>
                </Card>
            ) : (
                <SingleObservationView observation={observation} index={index}/>
            )}
        </>
    )
}