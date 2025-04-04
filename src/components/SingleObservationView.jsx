/* eslint-disable react/prop-types */
import { Card, Button } from 'react-bootstrap'
import { useContext, useEffect, useState } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { formatDate, formatLocation } from '../utils/formatHelperFunctions'
import chickadee from '../assets/chickadee.png'
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function SingleObservationView() {
    const { id } = useParams();
    const { observations, singleObsView, setSingleObsView } = useContext(ObservationsContext);
    const observation = observations.obs.find(obs => obs.subId === id);
    const [wikipediaImgURL, setWikipediaImgURL] = useState({})

    const navigate = useNavigate();

    const handleBackToObservations = () => {
        setSingleObsView(-1);
        navigate(`/observations`);
    }

    // Function to fetch the Wikipedia image URL using the species name from the observation
    const fetchWikiImgURL = () => {
        fetch(`/.netlify/functions/fetchWikipediaImage?speciesName=${observation.comName}`)
            .then(response => response.json())
            .then(data => {
                const url = data.query.pages[Object.keys(data.query.pages)].original
                if (url) {
                    setWikipediaImgURL(url.source)
                } else {
                    setWikipediaImgURL(chickadee)
                }
            })
    }

    useEffect(()=> {
        if (observation) {
            fetchWikiImgURL();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [observation])

    return observation ? (
        <Card className='observation-single-page-view'>
            <Card.Body className="single-page-card-body">
                <Card.Title className="single-page-card-title">
                    {observation.comName}
                </Card.Title>
                <Card.Text className="single-page-card-date">
                    Observation date: {formatDate(observation.obsDt)}
                </Card.Text>
                <Card.Text className="single-page-card-location">
                    Location: {formatLocation(observation.locName, singleObsView)}
                </Card.Text>
                <Card.Img src={wikipediaImgURL} className='single-page-card-image'/>
                <Card.Link href={`https://en.wikipedia.org/wiki/${observation.comName}`} className="wiki-link">Learn more about the {observation.comName} on Wikipedia</Card.Link>
                <Button variant="outline-primary" onClick={handleBackToObservations}>Back to observations</Button>
            </Card.Body>
        </Card>
    ) : (
        <p>Observation not found</p>
    );
}