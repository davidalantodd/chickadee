/* eslint-disable react/prop-types */
import { Card, Button } from 'react-bootstrap'
import { useContext, useEffect, useState } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { formatDate, formatLocation } from '../utils/formatHelperFunctions'
import chickadee from '../assets/chickadee.png'
import { useNavigate } from 'react-router-dom';

export default function SingleObservationView() {
    const { singleObsView, setSingleObsView } = useContext(ObservationsContext);
    const [wikipediaImgURL, setWikipediaImgURL] = useState({})
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(window.location.search);
    const observationComName = searchParams.get('commonName');
    const observationLocation = searchParams.get('location');
    const observationDate = searchParams.get('date');

    const handleBackToObservations = () => {
        setSingleObsView(-1);
        navigate(`/observations`);
    }

    // Function to fetch the Wikipedia image URL using the species name from the observation
    const fetchWikiImgURL = () => {
        fetch(`/.netlify/functions/fetchWikipediaImage?speciesName=${observationComName}`)
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
        fetchWikiImgURL();
    }, [])

    return (
        <Card className='observation-single-page-view'>
            <Card.Body className="single-page-card-body">
                <Card.Title className="single-page-card-title">
                    {observationComName}
                </Card.Title>
                <Card.Text className="single-page-card-date">
                    Observation date: {formatDate(observationDate)}
                </Card.Text>
                <Card.Text className="single-page-card-location">
                    Location: {formatLocation(observationLocation, singleObsView)}
                </Card.Text>
                <Card.Img src={wikipediaImgURL} className='single-page-card-image'/>
                <Card.Link href={`https://en.wikipedia.org/wiki/${observationComName}`} className="wiki-link">Learn more about the {observationComName} on Wikipedia</Card.Link>
                <Button variant="outline-primary" onClick={handleBackToObservations}>Back to observations</Button>
            </Card.Body>
        </Card>
    )
}