/* eslint-disable react/prop-types */
import { useEffect, useContext, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext';
import Observation from './Observation'
import LoadingMessage from './LoadingMessage'

const PAGE_SIZE = 100

// The loaded (and searched) observations as a list, rendered 100 at a time as the page scrolls
function ObservationList({ emptyMessage }) {
    const { observations, filteredObservations } = useContext(ObservationsContext)
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Start over at the top with the first page whenever a new set of observations loads
    useEffect(() => {
        setVisibleCount(PAGE_SIZE)
        window.scrollTo(0, 0)
    }, [observations.key])

    // Show the next page when the bottom of the list scrolls into view
    useEffect(() => {
        const handleScroll = () => {
            const nearBottom = window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100
            if (nearBottom && visibleCount < filteredObservations.obs.length) setVisibleCount(count => count + PAGE_SIZE)
        }
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [filteredObservations.obs.length, visibleCount]);

    const observationsToDisplay = filteredObservations.obs.slice(0, visibleCount);

    if (observationsToDisplay.length === 0) {
        return <section className="loading"><h4>{emptyMessage}</h4></section>
    }

    return (
        <>
            <Container fluid className="observation-container">
                {observationsToDisplay.map((observation, index) => (
                    <Observation observation={observation} index={index} key={observation.subId + observation.comName}/>
                ))}
            </Container>
            {visibleCount < filteredObservations.obs.length && (
                <div className="loading-more">
                    <LoadingMessage text="loading more birds..."/>
                </div>
            )}
        </>
    )
}

export default ObservationList
