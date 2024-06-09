import { useEffect, useContext } from 'react'
import { Card, ListGroup, Container } from 'react-bootstrap'
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
        currentRegion, currentSubRegion } = useContext(ObservationsContext)
    

    const fetchObservationsByRegion = () => {
        const regionToSearch = (currentSubRegion.code) ? currentSubRegion : currentRegion
        fetch(eBirdBaseAPIURL + `data/obs/${regionToSearch.code}/recent`, requestOptions)
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


    useEffect(() => {
        fetchObservationsByRegion()
        fetchRegionsInUS()
        fetchSubRegions();
    }, [])

    useEffect(() => {
        fetchObservationsByRegion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRegion, currentSubRegion])

    console.log(currentRegion)


    return (
        <>
          {/* <h3>Bird observations in {(currentRegion.code === 'US' || currentRegion.code === "US-DC" ? 'the ' : '') + currentRegion.name}</h3> */}
          <Container className="observation-section">
            {(currentRegion.code === observations.region) || (currentSubRegion.code === observations.region) ? (
                observations.obs.map((observation) => (
                    <Card className="bird-card" key={observation.subId + observation.comName} style={{ width: '14rem'}}>
                        <Card.Body>
                        <Card.Title>
                            {observation.comName}
                        </Card.Title>
                        <ListGroup variant="flush">
                            <ListGroup.Item>Date: {observation.obsDt}</ListGroup.Item>
                            <ListGroup.Item>Location: {observation.locName}</ListGroup.Item>
                        </ListGroup>
                        </Card.Body>
                    </Card>
                ))
            ) : (
                <h4>loading...</h4>
            )}
          </Container>
        </>
      )
}

export default Observations