import { useNavigate } from 'react-router-dom';
import chickadeeLarge from '../assets/carolina-chickadee-1920.jpg'
import chickadeeSmall from '../assets/carolina-chickadee-1200.jpg'

function LandingPage() {
    const navigate = useNavigate();

    return (
        <section className="landing-page">
            <img
                src={chickadeeLarge}
                srcSet={`${chickadeeSmall} 1200w, ${chickadeeLarge} 1920w`}
                sizes="100vw"
                alt="Carolina Chickadee perched on a branch"
                className="landing-page-image"
            />
            <div className="landing-page-content">
                <p className="landing-page-kicker">Live from eBird</p>
                <h2 className="landing-page-heading">Recent bird sightings, worldwide</h2>
                <p className="landing-page-text">
                    Browse the last 30 days of reports by place or species, in a list or on a map.
                </p>
                <button type="button" className="landing-page-button" onClick={() => navigate('/observations')}>
                    Browse sightings
                </button>
            </div>
            <p className="landing-page-credit">
                Photo: Dan Pancamo / <a href="https://creativecommons.org/licenses/by-sa/2.0" target="_blank" rel="noreferrer">CC BY-SA 2.0</a> / <a href="https://commons.wikimedia.org/wiki/File:Carolina_Chickadee1_by_Dan_Pancamo.jpg" target="_blank" rel="noreferrer">image source</a>
            </p>
        </section>
    )
}

export default LandingPage
