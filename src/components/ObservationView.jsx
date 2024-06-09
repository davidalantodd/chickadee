import Observations from './Observations'
import { useState } from 'react'
import { ObservationsContext } from '../contexts/ObservationsContext';

function ObservationView() {

    const [observations, setObservations] = useState({
        region: '',
        obs: []
    });
    const [regionsInUS, setRegionsInUS] = useState([])
    const [currentRegion, setCurrentRegion] = useState({
        code:'US',
        name:'United States'
    })
    const [subRegions, setSubRegions] = useState([])
    const [currentSubRegion, setCurrentSubRegion] = useState({
        code:'',
        name:''
    })

    return (
        <ObservationsContext.Provider value = {
            {observations, setObservations,
                regionsInUS, setRegionsInUS,
                currentRegion, setCurrentRegion,
                subRegions, setSubRegions,
                currentSubRegion, setCurrentSubRegion}
        }>
            <Observations className="observations-component"/>
        </ObservationsContext.Provider>
    )
}


export default ObservationView