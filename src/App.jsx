import './App.css'
import { useEffect, useState } from 'react'
import { Card, ListGroup } from 'react-bootstrap'


function App() {
  const eBirdAPI = 'https://api.ebird.org/v2/data/obs/US-MA/recent'

  const [observations, setObservations] = useState([]);

  const myHeaders = new Headers();
  myHeaders.append("X-eBirdApiToken", import.meta.env.VITE_EBIRD_API_KEY);

  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  useEffect(() => {
    fetch(eBirdAPI, requestOptions)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setObservations(data)
      })
  }, [])


  return (
    <>
      <h1>eBird Recent Observations</h1>
      <section className="observation-section">
        {observations.map((observation) => (
          <Card key={observation.subId + observation.comName} style={{ width: '18rem'}}>
            <Card.Body>
              <Card.Title>
                {observation.comName}
              </Card.Title>
              <Card.Text>
                <ListGroup variant="flush">
                  <ListGroup.Item> Date: {observation.obsDt}</ListGroup.Item>
                  <ListGroup.Item>Location: {observation.locName}</ListGroup.Item>
                </ListGroup>
              </Card.Text>
            </Card.Body>
        </Card>
        ))
        }
      </section>
    </>
  )
}

export default App
