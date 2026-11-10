import { Modal } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { formatDate } from '../utils/format'
import { listLink, readUrlObservation } from '../utils/url'
import chickadee from '../assets/chickadee.png'

// Details for one observation, shown over the list/map while the URL is /observations/:id.
// All content is read from the URL.
export default function ObservationModal() {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const navigate = useNavigate()

    const fromUrl = readUrlObservation(id, searchParams)
    // Last observation shown, kept so the content stays visible during the fade-out after the URL changes
    const [observation, setObservation] = useState(fromUrl)
    if (fromUrl && (fromUrl.subId !== observation?.subId || fromUrl.speciesCode !== observation?.speciesCode)) {
        setObservation(fromUrl)
    }

    // null while loading or when the species has no photo; otherwise { urls, artist, license, licenseUrl, filePageUrl }
    const [wikipediaImage, setWikipediaImage] = useState(null)
    const [imageLoaded, setImageLoaded] = useState(false)
    // Leaflet sizes itself from its container when created, so the map mounts after the open animation
    const [showMap, setShowMap] = useState(false)

    const speciesCode = observation?.speciesCode
    // Fetch the species' photo and credit; fall back to the bundled chickadee on any failure
    useEffect(() => {
        if (!speciesCode) return
        let cancelled = false
        setImageLoaded(false)
        setWikipediaImage(null)
        fetch(`/.netlify/functions/fetchSpeciesImage?speciesCode=${encodeURIComponent(speciesCode)}`)
            .then(response => response.ok ? response.json() : { image: null })
            .then(data => { if (!cancelled) setWikipediaImage(data.image) })
            .catch(() => { if (!cancelled) setWikipediaImage(null) })
            .finally(() => { if (!cancelled) setImageLoaded(true) })
        return () => { cancelled = true }
    }, [speciesCode])

    // From the list: go back to that history entry. From a pasted link: replace the URL with the list's.
    const handleClose = () => {
        if (location.state?.fromList) navigate(-1)
        else navigate(listLink(location.search), { replace: true })
    }

    const hasPosition = Number.isFinite(observation?.lat) && Number.isFinite(observation?.lng)
    // Private locations arrive with an opaque id and rounded coordinates (see fetchObservationsByRegion),
    // so only real checklist ids (S followed by digits) get a link to eBird
    const isChecklistId = /^S\d+$/.test(observation?.subId ?? '')

    return (
        <Modal
            show={Boolean(fromUrl)}
            onHide={handleClose}
            onEntered={() => setShowMap(true)}
            onExited={() => setShowMap(false)}
            size="lg"
            centered
            className="observation-modal"
        >
            {observation && (
                <>
                    <Modal.Header closeButton>
                        <Modal.Title className="observation-modal-title">{observation.commonName}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="observation-modal-body">
                        <figure className="observation-modal-figure">
                            {imageLoaded ? (
                                <img
                                    src={wikipediaImage?.urls.modal ?? chickadee}
                                    // Standard Wikimedia widths: phones take the 500px copy, larger screens the 960px one
                                    srcSet={wikipediaImage ? `${wikipediaImage.urls.modalSmall} 500w, ${wikipediaImage.urls.modal} 960w` : undefined}
                                    sizes="(max-width: 576px) 100vw, 766px"
                                    className="observation-modal-image"
                                    alt={observation.commonName}
                                />
                            ) : (
                                <div className="observation-modal-image-placeholder"/>
                            )}
                            {imageLoaded && wikipediaImage && (
                                <figcaption className="image-credit">
                                    Photo: {wikipediaImage.artist ?? 'Unknown author'}
                                    {wikipediaImage.license && <>{' / '}{wikipediaImage.licenseUrl
                                        ? <a href={wikipediaImage.licenseUrl} target="_blank" rel="noreferrer">{wikipediaImage.license}</a>
                                        : wikipediaImage.license}</>}
                                    {wikipediaImage.filePageUrl && <>{' / '}<a href={wikipediaImage.filePageUrl} target="_blank" rel="noreferrer">image source</a></>}
                                </figcaption>
                            )}
                        </figure>
                        <dl className="observation-modal-details">
                            <dt>Seen</dt>
                            <dd>{observation.date ? formatDate(observation.date) : 'Unknown'}</dd>
                            <dt>Location</dt>
                            <dd>
                                {observation.location}
                                {!isChecklistId && <span className="observation-modal-note"> · map shows the approximate area</span>}
                            </dd>
                            {observation.area && (
                                <>
                                    <dt>Area</dt>
                                    <dd>near {observation.area}</dd>
                                </>
                            )}
                        </dl>
                        {hasPosition && (
                            <div className="observation-modal-map">
                                {showMap && (
                                    <MapContainer
                                        key={`${observation.subId}-${observation.speciesCode}`}
                                        center={[observation.lat, observation.lng]}
                                        zoom={10}
                                        scrollWheelZoom={false}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <Marker position={[observation.lat, observation.lng]}/>
                                    </MapContainer>
                                )}
                            </div>
                        )}
                        <div className="observation-modal-links">
                            {isChecklistId && (
                                <a
                                    href={`https://ebird.org/checklist/${observation.subId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    View checklist on eBird
                                </a>
                            )}
                            <a
                                href={`https://en.wikipedia.org/wiki/${encodeURIComponent(observation.commonName)}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Learn more about the {observation.commonName} on Wikipedia
                            </a>
                        </div>
                    </Modal.Body>
                </>
            )}
        </Modal>
    )
}
