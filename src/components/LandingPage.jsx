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
            <img src={chickadeeImage} alt="Carolina Chickadee by Dan Pancamo. Image source: https://en.wikipedia.org/wiki/File:Carolina_Chickadee1_by_Dan_Pancamo.jpg" className="landing-page-image" />
            <Button className="landing-page-button" onClick={handleButtonClick}>
                View Recent Bird Observations
            </Button>
        </div>
    )
}

export default LandingPage