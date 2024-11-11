/* eslint-disable react/prop-types */
import { Card, Button } from 'react-bootstrap'
import { useContext, useEffect, useState } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext'
import { formatDate, formatLocation } from '../utils/formatHelperFunctions'
import chickadee from '../assets/chickadee.png'

export default function SingleObservationView({observation, index}) {
    const { singleObsView, setSingleObsView } = useContext(ObservationsContext)
    const [wikipediaImgURL, setWikipediaImgURL] = useState({})

    const handleSingleObsView = () => {
        setSingleObsView(singleObsView === -1 ? index : -1)
    }

    const fetchWikiImgURL = () => {
        fetch(`/.netlify/functions/fetchWikipediaImage?speciesName=${observation.comName}`)
            .then(response => response.json())
            .then(data => {
                const url = data.query.pages[Object.keys(data.query.pages)].original
                if (url) {
                    setWikipediaImgURL(url.source)
                } else {
                    setWikipediaImgURL(chickadee)
                }
            })
    }

    useEffect(()=> {
        fetchWikiImgURL();
    },[])

    return (
        <>
            <Card className='observation-single-page-view'>
                <Card.Body className="single-page-card-body">
                    <Card.Title className="single-page-card-title">
                        {observation.comName}
                    </Card.Title>
                    <Card.Text className="single-page-card-date">
                        {formatDate(observation.obsDt)}
                    </Card.Text>
                    <Card.Text className="single-page-card-location">
                        {formatLocation(observation.locName)}
                    </Card.Text>
                    <Card.Img src={wikipediaImgURL} className='single-page-card-image'/>
                    <Button variant="outline-primary" onClick={handleSingleObsView}>Back to Observations</Button>
                </Card.Body>
            </Card>
        </>
    )
}