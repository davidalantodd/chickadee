import { useEffect, useContext } from 'react'
import { Table } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext';

function Observations() {
    const {observations, setObservations,
        setSubRegions, setRegionsInUS,
        currentRegion, currentSubRegion,
        notable, currentSpecies } = useContext(ObservationsContext)
    

    // fetch eBird API data using Netlify Functions to protect API key
    const fetchObservationsByRegion = () => {
        const regionToSearch = (currentSubRegion.code) ? currentSubRegion : currentRegion
        fetch(`/.netlify/functions/fetchObservationsByRegion?regionToSearch=${regionToSearch.code}&notable=${notable}&currentSpecies=${currentSpecies.speciesCode}`)
            .then(response => response.json())
            .then(data => {
                setObservations({
                    region: regionToSearch.code,
                    obs: data})
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
        <>
            {(currentRegion.code === observations.region) || (currentSubRegion.code === observations.region) ? (
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
                <h4>loading...</h4>
            )}
          
        </>
      )
}

export default Observations