import ObservationView from './components/ObservationView'
import Header from './components/Header';
import Footer from './components/Footer'
import { ObservationsContext } from './contexts/ObservationsContext';
import { useState } from 'react'

function App() {

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
  const [notable, setNotable] = useState(false)
  const [taxonomy, setTaxonomy] = useState([])
  const [currentSpecies, setCurrentSpecies] = useState('')
  
  return (
    <>
      <ObservationsContext.Provider value = {{observations, setObservations,
                                                  regionsInUS, setRegionsInUS,
                                                  currentRegion, setCurrentRegion,
                                                  subRegions, setSubRegions,
                                                  currentSubRegion, setCurrentSubRegion,
                                                  notable, setNotable,
                                                  taxonomy, setTaxonomy,
                                                  currentSpecies, setCurrentSpecies}}>
        <Header/>
        <main>
          <ObservationView className="observation-view"/>
        </main>
        <Footer/>
      </ObservationsContext.Provider>
    </>
  )
}

export default App
