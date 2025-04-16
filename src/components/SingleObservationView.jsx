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
    const [isImageLoading, setIsImageLoading] = useState(true);
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(window.location.search);
    const observationComName = searchParams.get('commonName');
    const observationLocation = searchParams.get('location');
    const observationDate = searchParams.get('date');
    const observationLat = searchParams.get('lat');
    const observationLng = searchParams.get('lng');

    const handleBackToObservations = () => {
        setSingleObsView(-1);
        navigate(`/observations`);
    }

    // Function to fetch the Wikipedia image URL using the species name from the observation
    const fetchWikiImgURL = () => {
        setIsImageLoading(true);
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
            .catch(() => {
                setWikipediaImgURL(chickadee);
            })
            .finally(() => {
                setIsImageLoading(false);
            });
    }
    
    useEffect(()=> {
        window.scrollTo(0, 0);
        fetchWikiImgURL();
    }, [])

    return (
        <Card className='observation-single-page-view'>
            <Card.Body className="single-page-card-body">
                <Button 
                    variant="outline-primary" 
                    onClick={handleBackToObservations} 
                    className='back-to-observations-button'
                    title="Back to observations"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                    </svg>
                </Button>
                <Card.Title className="single-page-card-title">
                    {observationComName}
                </Card.Title>
                <div className="image-container">
                    {isImageLoading && (
                        <div className="image-placeholder">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                className="bi bi-arrow-clockwise loading-arrow" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                            </svg>
                        </div>
                    )}
                    <Card.Img 
                        src={wikipediaImgURL} 
                        className={`single-page-card-image ${isImageLoading ? 'd-none' : ''}`} 
                        title={`picture of ${observationComName} sourced from Wikipedia`}
                        onError={() => {
                            setWikipediaImgURL(chickadee);
                        }}
                    />
                </div>
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