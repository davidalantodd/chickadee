import { useEffect, useContext } from 'react'
import { Table } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext';

function Observations() {
    const {observations, setObservations,
        setSubRegions, setRegionsInUS,
        currentRegion, currentSubRegion,
        notable, currentSpecies,
        loading, setLoading } = useContext(ObservationsContext)
    

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

    const fetchRegionsInUS = async () => {
        await fetch('/.netlify/functions/fetchRegionsInUS')
            .then(response => response.json())
            .then(data => setRegionsInUS(data))
            .catch(error => {
                console.error('Error fetching regions:', error);
              });
    }

    const fetchSubRegions = async () => {
        await fetch(`/.netlify/functions/fetchSubRegions?currentRegion=${currentRegion.code}`)
        .then(response => response.json())
        .then(data => {setSubRegions(data)})
        .catch(error => {
            console.error('Error fetching subregions:', error);
          });
    }

    const formatDate = (originalDateString) => {
        const date = new Date(originalDateString)

        const formatter = new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })

        return formatter.format(date);
    }


    useEffect(() => {
        fetchObservationsByRegion()
        fetchRegionsInUS()
        fetchSubRegions();
    }, [])

    useEffect(() => {
        fetchObservationsByRegion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRegion, currentSubRegion, notable, currentSpecies])


    return (
        <>{
            (!loading && observations.obs.length > 0) ? (
                <Table striped bordered hover className="observation-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Common Name</th>
                            <th style={{ minWidth: '225px'}}>Date</th>
                            <th>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(observations.obs.map((observation, index) => (
                            <tr key={observation.subId + observation.comName}>
                                <td>{index + 1}</td>
                                <td>{observation.comName}</td>
                                <td>{formatDate(observation.obsDt)}</td>
                                <td>{observation.locName}</td>
                            </tr>
                        )))}
                    </tbody>
                </Table>
            ) : (
                (loading) ? (
                    <section className="loading">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-arrow-clockwise loading-arrow" viewBox="0 0 16 16">
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