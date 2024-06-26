import { useEffect, useContext } from 'react'
import { Table } from 'react-bootstrap'
import { ObservationsContext } from '../contexts/ObservationsContext';

const eBirdBaseAPIURL = 'https://api.ebird.org/v2/'
const myHeaders = new Headers();
myHeaders.append("X-eBirdApiToken", import.meta.env.VITE_EBIRD_API_KEY);

const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
};

function Observations() {
    const {observations, setObservations,
        setSubRegions, setRegionsInUS,
        currentRegion, currentSubRegion,
        notable, currentSpecies } = useContext(ObservationsContext)
    

    const fetchObservationsByRegion = () => {
        const regionToSearch = (currentSubRegion.code) ? currentSubRegion : currentRegion
        fetch(eBirdBaseAPIURL + `data/obs/${regionToSearch.code}/recent`
            + (notable ? '/notable' : (
                currentSpecies.comName ? `/${currentSpecies.speciesCode}` : '')
            ), requestOptions)
        .then(response => response.json())
        .then(data => {
            setObservations({
                region: regionToSearch.code,
                obs: data})
        })
    }

    const fetchRegionsInUS = () => {
        fetch(eBirdBaseAPIURL + 'ref/region/list/subnational1/US', requestOptions)
        .then(response => response.json())
        .then(data =>
            setRegionsInUS(data)
        )
    }

    const fetchSubRegions = () => {
        fetch(eBirdBaseAPIURL + `ref/region/list/subnational2/${currentRegion.code}`, requestOptions)
        .then(response => response.json())
        .then(data => {setSubRegions(data)});
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

    console.log(currentRegion)


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