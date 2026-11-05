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
    // null while loading or when Wikipedia has no image; otherwise { src, artist, license, licenseUrl, filePageUrl }
    const [wikipediaImage, setWikipediaImage] = useState(null)
    const [imageLoaded, setImageLoaded] = useState(false)
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

    // Fetch the species' Wikipedia image and its credit; fall back to the bundled chickadee on any failure
    const fetchWikiImage = () => {
        fetch(`/.netlify/functions/fetchWikipediaImage?speciesName=${encodeURIComponent(observationComName)}`)
            .then(response => response.ok ? response.json() : { image: null })
            .then(data => setWikipediaImage(data.image))
            .catch(() => setWikipediaImage(null))
            .finally(() => setImageLoaded(true))
    }
    
    useEffect(()=> {
        window.scrollTo(0, 0);
        fetchWikiImage();
    }, [])

    return (
        <Card className='observation-single-page-view'>
            <Card.Body className="single-page-card-body">
                <Button variant="outline-primary" onClick={handleBackToObservations} className='back-to-observations-button'>Back to observations</Button>
                <Card.Title className="single-page-card-title">
                    {observationComName}
                </Card.Title>
                {imageLoaded && (
                    <figure className="single-page-card-figure">
                        <Card.Img src={wikipediaImage?.src ?? chickadee} className='single-page-card-image' alt={observationComName}/>
                        {wikipediaImage && (
                            <figcaption className="image-credit">
                                Photo: {wikipediaImage.artist ?? 'Unknown author'}
                                {wikipediaImage.license && <>{' / '}{wikipediaImage.licenseUrl
                                    ? <a href={wikipediaImage.licenseUrl} target="_blank" rel="noreferrer">{wikipediaImage.license}</a>
                                    : wikipediaImage.license}</>}
                                {wikipediaImage.filePageUrl && <>{' / '}<a href={wikipediaImage.filePageUrl} target="_blank" rel="noreferrer">image source</a></>}
                            </figcaption>
                        )}
                    </figure>
                )}
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
                <Card.Link href={`https://en.wikipedia.org/wiki/${encodeURIComponent(observationComName)}`} className="wiki-link">Learn more about the {observationComName} on Wikipedia</Card.Link>
            </Card.Body>
        </Card>
    )
}