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
  const [filteredTaxonomy, setFilteredTaxonomy] = useState(null)
  const [currentSpecies, setCurrentSpecies] = useState('')
  const [loading, setLoading] = useState(true)
  const [speciesFilter, setSpeciesFilter] = useState('');
  
  return (
    <>
      <ObservationsContext.Provider value = {{observations, setObservations,
                                                  filteredTaxonomy, setFilteredTaxonomy,
                                                  regionsInUS, setRegionsInUS,
                                                  currentRegion, setCurrentRegion,
                                                  subRegions, setSubRegions,
                                                  currentSubRegion, setCurrentSubRegion,
                                                  notable, setNotable,
                                                  taxonomy, setTaxonomy,
                                                  currentSpecies, setCurrentSpecies,
                                                  loading, setLoading,
                                                  speciesFilter, setSpeciesFilter}}>
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
