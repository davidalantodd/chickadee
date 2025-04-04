import { useEffect, useContext } from 'react'
import { Container } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext';
import Observation from './Observation'

// eslint-disable-next-line react/prop-types
function Observations({filterText}) {
    const {observations, setObservations,
        currentRegion, currentSubRegion,
        notable, currentSpecies,
        loading, setLoading,
        singleObsView, filteredObservations
        } = useContext(ObservationsContext)
    
    // Function to fetch eBird API data using Netlify Functions to protect API key
    const fetchObservationsByRegion = () => {
        setLoading(true)
        const regionToSearch = (currentSubRegion.code) ? currentSubRegion : currentRegion
        fetch(`/.netlify/functions/fetchObservationsByRegion?regionToSearch=${regionToSearch.code}&notable=${notable}&currentSpecies=${currentSpecies.speciesCode}`)
            .then(response => response.json())
            .then(data => {
                setObservations({
                    region: regionToSearch.code,
                    obs: data})
                setLoading(false)
            })
            .catch(error => {
                console.error('Error fetching observations:', error, regionToSearch.code, notable,currentSpecies.comName );
              });
    }

    // Fetch observations whenever relevant filters or regions change
    useEffect(() => {
        fetchObservationsByRegion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRegion, currentSubRegion, notable, currentSpecies])

    // Restore scroll position after loading observations
    useEffect(() => {
        if (!loading && observations.obs.length > 0) {
            const scrollPosition = localStorage.getItem('scrollPosition');
            if (scrollPosition) {
                window.scrollTo(0, parseInt(scrollPosition, 10));
                localStorage.removeItem('scrollPosition');
            }
        }
    }, [loading, observations]);

    const observationsToDisplay = filteredObservations.obs;


    return (
        <>
        {
            // Render observations if data is available, otherwise show loading or no data message
            (!loading && (observationsToDisplay.length > 0 || filterText === "")) ? (
                <>
                    <Container fluid className="observation-container">
                        {(observationsToDisplay.map((observation, index) => (
                            (singleObsView === -1 ? (
                            <Observation observation={observation} index={index} key={observation.subId + observation.comName}/>
                            ) : (
                                (index === singleObsView) ? (
                                    <Observation observation={observation} index={index} key={observation.subId + observation.comName}/>
                                ) : null
                            ))
                        )))}
                    </Container>
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
                        // Show message if no observations are found
                        <section className="loading">
                            <h4>no birds found 😔 try adjusting your filters</h4>
                        </section>
                    )
               
            )}
        </>
      )
}

export default Observations