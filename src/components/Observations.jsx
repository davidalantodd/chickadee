import { useEffect, useState } from 'react'
import { Card, ListGroup, Container, Dropdown } from 'react-bootstrap'

const eBirdBaseAPIURL = 'https://api.ebird.org/v2/'

const myHeaders = new Headers();

myHeaders.append("X-eBirdApiToken", import.meta.env.VITE_EBIRD_API_KEY);

const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
};

function Observations() {

    const [observations, setObservations] = useState({
        region: '',
        obs: []
    });
    const [regionsInUS, setRegionsInUS] = useState([])
    const [currentRegion, setCurrentRegion] = useState({
        code:'US',
        name:'United States'
    })

    const fetchObservationsByRegion = () => {
        fetch(eBirdBaseAPIURL + `data/obs/${currentRegion.code}/recent`, requestOptions)
        .then(response => response.json())
        .then(data => {
            setObservations({
                region: currentRegion.code,
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

    const handleRegionSelect = (region) => {
        setCurrentRegion(region)
    } 

    useEffect(() => {
        fetchRegionsInUS()
        fetchObservationsByRegion()
    }, [])

    useEffect(() => {
        fetchObservationsByRegion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRegion])


    return (
        <>
          <h1 className="title">eBird Recent Observations</h1>
          <section className="filter-bar">
            <h5>Filter by State</h5>
            <Dropdown className='region-dropdown'>
                <Dropdown.Toggle variant="primary" id="dropdown-basic">
                    {currentRegion.name !== 'United States' ? currentRegion.name : 'Select State'}
                </Dropdown.Toggle>
                <Dropdown.Menu className='region-dropdown-menu'>
                    {regionsInUS.map((region) => (
                        <Dropdown.Item key={region.code} onClick={()=>handleRegionSelect(region)}>{region.name}</Dropdown.Item>
                    ))}
                    <Dropdown.Item key={'default'} onClick={()=>setCurrentRegion({code:'US',name:'United States'})}>Clear Selection</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
          </section>
          {/* <h3>Bird observations in {(currentRegion.code === 'US' || currentRegion.code === "US-DC" ? 'the ' : '') + currentRegion.name}</h3> */}
          <Container className="observation-section">
            {(currentRegion.code === observations.region) ? (
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