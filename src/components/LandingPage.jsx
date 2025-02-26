import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';

function LandingPage() {
    const navigate = useNavigate();

    const handleButtonClick = () => {
        navigate('/observations')
    }

    return (
        <div className="landing-page">
            <Button className="landing-page-button" onClick={handleButtonClick}>
                View Observations
            </Button>
        </div>
    )
}

export default LandingPage