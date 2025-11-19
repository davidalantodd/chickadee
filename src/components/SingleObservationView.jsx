/* eslint-disable react/prop-types */
import { Card, Button } from 'react-bootstrap'
import { useContext, useEffect, useState } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { formatDate, formatLocation } from '../utils/format'
import chickadee from '../assets/chickadee.png'
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
export default function SingleObservationView() {
    const { singleObsView, setSingleObsView } = useContext(ObservationsContext);
    const [wikipediaImgURL, setWikipediaImgURL] = useState({})
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(window.location.search);
    const observationComName = searchParams.get('commonName');
    const observationLocation = searchParams.get('location');
    const observationDate = searchParams.get('date');
    const observationLat = searchParams.get('lat');
    const observationLng = searchParams.get('lng');

    const handleBackToObservations = () => {
        navigate(`/observations`);
        setSingleObsView(-1);
    }

    // Function to fetch the Wikipedia image URL using the species name from the observation
    const fetchWikiImgURL = () => {
        fetch(`/.netlify/functions/fetchWikipediaImage?speciesName=${observationComName}`)
            .then(response => {
                if (!response.ok) {
                    setWikipediaImgURL(chickadee)
                    return;
                }
                response.json()
                    .then(data => {
                        const url = data.query.pages[Object.keys(data.query.pages)].original
                        if (url) {
                            setWikipediaImgURL(url.source)
                        } else {
                            setWikipediaImgURL(chickadee)
                        }
                    })
            })
    }
    
    useEffect(()=> {
        window.scrollTo(0, 0);
        fetchWikiImgURL();
    }, [])

    return (
        <Card className='observation-single-page-view'>
            <Card.Body className="single-page-card-body">
                <Button variant="outline-primary" onClick={handleBackToObservations} className='back-to-observations-button'>Back to observations</Button>
                <Card.Title className="single-page-card-title">
                    {observationComName}
                </Card.Title>
                <Card.Img src={wikipediaImgURL} className='single-page-card-image' title={`picture of ${observationComName} sourced from Wikipedia`}/>
                <Card.Text className="single-page-card-date">
                    Observation date: {formatDate(observationDate)}
                </Card.Text>
                <Card.Text className="single-page-card-location">
                    Location: {formatLocation(observationLocation, singleObsView)}
                </Card.Text>
                <MapContainer center={[observationLat, observationLng]} zoom={10} scrollWheelZoom={false} id="map-small">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[observationLat, observationLng]}>
                        <Popup>
                            {observationLocation}
                        </Popup>
                    </Marker>
                </MapContainer>
                <Card.Link href={`https://en.wikipedia.org/wiki/${observationComName}`} className="wiki-link">Learn more about the {observationComName} on Wikipedia</Card.Link>
            </Card.Body>
        </Card>
    )
}