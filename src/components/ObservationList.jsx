import { useEffect, useContext, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext';
import Observation from './Observation'
import { useObservations } from '../hooks/useObservations'

// eslint-disable-next-line react/prop-types
function Observations() {
    const {observations, currentCountry,
        loading, filteredObservations
        } = useContext(ObservationsContext)
    
    const [visibleCount, setVisibleCount] = useState(100);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Handle scroll event to load more observations
    const handleScroll = () => {
        if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
            if (!isLoadingMore && visibleCount < filteredObservations.obs.length) {
                setIsLoadingMore(true);
                setVisibleCount(prevCount => prevCount + 100);
                setIsLoadingMore(false);
            }
        }
    };

    // Scroll event listener
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [filteredObservations.obs.length, visibleCount, isLoadingMore]);

    // Fetch observations whenever relevant filters or regions change, resetting pagination on each load
    useObservations(() => setVisibleCount(100))

    // Scroll to the top whenever a new set of observations loads
    useEffect(() => {
        if (!loading && observations.obs.length > 0) {
            window.scrollTo(0, 0);
        }
    }, [loading, observations]);

    const observationsToDisplay = filteredObservations.obs.slice(0, visibleCount);

    return (
        <>
        {
            // Render observations if data is available, otherwise show loading or no data message
            (!loading && (observationsToDisplay.length > 0)) ? (
                <>
                    <Container fluid className="observation-container">
                        {observationsToDisplay.map((observation, index) => (
                            <Observation observation={observation} index={index} key={observation.subId + observation.comName}/>
                        ))}
                    </Container>
                    {visibleCount < filteredObservations.obs.length && (
                        <div className="loading-more">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                    className="bi bi-arrow-clockwise loading-arrow" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                            </svg>
                            <h4>loading more birds...</h4>
                        </div>
                    )}
                </>
            ) : (
                (loading) ? (
                    // Show loading spinner while data is being fetched
                    <section className="loading">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                className="bi bi-arrow-clockwise loading-arrow" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                        </svg>
                        <h4>loading birds...</h4>
                    </section>
                    ) : (
                        // Show message based on whether a country is selected
                        <section className="loading">
                            {!currentCountry.code ? (
                                <h4>🐦 select a country to view birds</h4>
                            ) : (
                                <h4>no birds found 😔 try adjusting your filters</h4>
                            )}
                        </section>
                    )
               
            )}
        </>
      )
}

export default Observations