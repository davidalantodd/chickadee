import { Modal } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { formatDate } from '../utils/format'
import { listLink, readUrlObservation } from '../utils/url'
import chickadee from '../assets/chickadee.png'

// Whether the main pointer is a mouse or trackpad. The popup map can be dragged with one, but not with touch,
// where a one-finger drag is also how the popup scrolls.
const canDragMap = () => window.matchMedia('(pointer: fine)').matches

// Marks a link that opens another site in a new tab
const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" className="observation-modal-link-icon">
        <path fillRule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
        <path fillRule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
    </svg>
)

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
    // The species' confirmed Wikipedia page, when it isn't simply titled with the common name
    const [wikipediaUrl, setWikipediaUrl] = useState(null)
    // Leaflet sizes itself from its container when created, so the map mounts after the open animation
    const [showMap, setShowMap] = useState(false)

    const speciesCode = observation?.speciesCode
    // Fetch the species' photo and credit; fall back to the bundled chickadee on any failure
    useEffect(() => {
        if (!speciesCode) return
        let cancelled = false
        setImageLoaded(false)
        setWikipediaImage(null)
        setWikipediaUrl(null)
        fetch(`/.netlify/functions/fetchSpeciesImage?speciesCode=${encodeURIComponent(speciesCode)}`)
            .then(response => response.ok ? response.json() : { image: null })
            .then(data => {
                if (cancelled) return
                setWikipediaImage(data.image)
                setWikipediaUrl(data.wikipediaUrl ?? null)
            })
            .catch(() => { if (!cancelled) setWikipediaImage(null) })
            .finally(() => { if (!cancelled) setImageLoaded(true) })
        return () => { cancelled = true }
    }, [speciesCode])

    // From the list: go back to that history entry. From a pasted link: replace the URL with the list's.
    const handleClose = () => {
        if (location.state?.fromList) navigate(-1)
        else navigate(listLink(location.search, location.pathname), { replace: true })
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
            // Full-screen sheet on phones; the header stays put while the body scrolls
            fullscreen="sm-down"
            scrollable
            className="observation-modal"
        >
            {observation && (
                <>
                    <Modal.Header closeButton>
                        <div>
                            <Modal.Title className="observation-modal-title">{observation.commonName}</Modal.Title>
                            <p className="observation-modal-date">{observation.date ? formatDate(observation.date) : 'Date unknown'}</p>
                        </div>
                    </Modal.Header>
                    <Modal.Body className="observation-modal-body">
                        <figure className="observation-modal-figure">
                            {imageLoaded ? (
                                // The whole photo at its own shape, centred on a soft panel when it's narrower than the column
                                <div className="observation-modal-photo-frame">
                                    <img
                                        src={wikipediaImage?.urls.modal ?? chickadee}
                                        // Standard Wikimedia widths; matches the photo's width: full screen on phones,
                                        // the 500px modal on tablets, and one of two columns from 992px
                                        srcSet={wikipediaImage ? `${wikipediaImage.urls.modalSmall} 500w, ${wikipediaImage.urls.modal} 960w` : undefined}
                                        sizes="(max-width: 575px) 100vw, (max-width: 991px) 460px, 420px"
                                        className="observation-modal-image"
                                        alt={observation.commonName}
                                    />
                                </div>
                            ) : (
                                <div className="observation-modal-photo-frame observation-modal-image-placeholder"/>
                            )}
                            {imageLoaded && wikipediaImage && (
                                <figcaption className="image-credit">
                                    Photo: {wikipediaImage.artist ?? 'Unknown author'}
                                    {wikipediaImage.license && <>{' / '}{wikipediaImage.licenseUrl
                                        ? <a href={wikipediaImage.licenseUrl} target="_blank" rel="noreferrer">{wikipediaImage.license}</a>
                                        : wikipediaImage.license}</>}
                                    {wikipediaImage.filePageUrl && <>{' / '}<a href={wikipediaImage.filePageUrl} target="_blank" rel="noreferrer">source</a></>}
                                </figcaption>
                            )}
                        </figure>
                        <div className="observation-modal-info">
                            <dl className="observation-modal-details">
                                <dt>Location</dt>
                                <dd>
                                    {observation.location}
                                    {!isChecklistId && <span className="observation-modal-note">Map shows the approximate area</span>}
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
                                        // Move it by dragging with a mouse or trackpad, and zoom with the buttons. Scroll-wheel
                                        // zoom is off so scrolling the popup never zooms the map, and touch dragging is off so a
                                        // swipe over the map scrolls the popup.
                                        <MapContainer
                                            key={`${observation.subId}-${observation.speciesCode}`}
                                            center={[observation.lat, observation.lng]}
                                            zoom={9}
                                            dragging={canDragMap()}
                                            touchZoom={false}
                                            doubleClickZoom={false}
                                            scrollWheelZoom={false}
                                            boxZoom={false}
                                            keyboard={false}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            />
                                            <Marker position={[observation.lat, observation.lng]} interactive={false}/>
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
                                        className="observation-modal-link observation-modal-link-primary"
                                        title="Opens the full checklist on eBird.org in a new tab"
                                    >
                                        View full checklist on eBird
                                        <ExternalLinkIcon/>
                                    </a>
                                )}
                                <a
                                    href={wikipediaUrl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(observation.commonName)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="observation-modal-link"
                                    title="Opens the species' Wikipedia article in a new tab"
                                >
                                    Read about this bird on Wikipedia
                                    <ExternalLinkIcon/>
                                </a>
                            </div>
                        </div>
                    </Modal.Body>
                </>
            )}
        </Modal>
    )
}
