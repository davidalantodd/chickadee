/* eslint-disable react/prop-types */
import { Card } from 'react-bootstrap'

export default function Observation({observation}) {
    

    const formatDate = (originalDateString) => {
        const date = new Date(originalDateString)

        const formatter = new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })

        return formatter.format(date);
    }


    return (
        <>
            <Card className="observation-card" >
                <Card.Body>
                <Card.Title>
                    {observation.comName}
                </Card.Title>
                <Card.Text>
                    <p>{formatDate(observation.obsDt)}</p>
                    <p>{observation.locName}</p>
                </Card.Text>
                </Card.Body>
            </Card>
        </>
    )
}