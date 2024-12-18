/* eslint-disable react/prop-types */
import { Card } from 'react-bootstrap'
import { useContext } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import SingleObservationView from './SingleObservationView'
import { formatDate, formatLocation } from '../utils/formatHelperFunctions'

export default function Observation({observation, index}) {
    const { singleObsView, setSingleObsView } = useContext(ObservationsContext)


    const handleSingleObsView = () => {
        setSingleObsView(singleObsView === -1 ? index : -1)
    }
    
    return (
        <>
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