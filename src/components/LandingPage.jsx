import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import chickadeeImage from '../assets/carolina-chickadee-wikipedia-image.jpg'

function LandingPage() {
    const navigate = useNavigate();

    const handleButtonClick = () => {
        navigate('/observations')
    }

    return (
        <div className="landing-page">
            <img src={chickadeeImage} alt="Carolina Chickadee perched on a branch" className="landing-page-image" />
            <Button className="landing-page-button" onClick={handleButtonClick}>
                View Recent Bird Observations
            </Button>
            <p className="landing-page-credit">
                Photo: Dan Pancamo / <a href="https://creativecommons.org/licenses/by-sa/2.0" target="_blank" rel="noreferrer">CC BY-SA 2.0</a> / <a href="https://commons.wikimedia.org/wiki/File:Carolina_Chickadee1_by_Dan_Pancamo.jpg" target="_blank" rel="noreferrer">image source</a>
            </p>
        </div>
    )
}

export default LandingPage