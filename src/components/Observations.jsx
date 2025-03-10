import { useEffect, useContext } from 'react'
import { Container } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext';
import Observation from './Observation'
function Observations() {
    const {observations, setObservations,
        currentRegion, currentSubRegion,
        notable, currentSpecies,
        loading, setLoading,
        singleObsView
        } = useContext(ObservationsContext)
    

    // fetch eBird API data using Netlify Functions to protect API key
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

    useEffect(() => {
        fetchObservationsByRegion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRegion, currentSubRegion, notable, currentSpecies])


    return (
        <>
        {
            (!loading && observations.obs.length > 0) ? (
                <>
                    <Container fluid className="observation-container">
                        {(observations.obs.map((observation, index) => (
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
                    <section className="loading">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                className="bi bi-arrow-clockwise loading-arrow" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                        </svg>
                        <h4>loading birds...</h4>
                    </section>
                    ) : (
                        <section className="loading">
                            <h4>no birds found 😔 try adjusting your filters</h4>
                        </section>
                    )
               
            )}
        </>
      )
}

export default Observations