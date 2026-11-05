import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ObservationView from './components/ObservationView'
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Footer from './components/Footer'
import { ObservationsContext } from './contexts/ObservationsContext';
import { useState } from 'react'
import SingleObservationView from './components/SingleObservationView';
import ScrollToTopButton from './components/ScrollToTopButton';

function App() {

  const [observations, setObservations] = useState({
    region: '',
    obs: []
  });
  const [countries, setCountries] = useState([])
  const [currentCountry, setCurrentCountry] = useState({
    code:'US',
    name:'United States'
  })
  const [regions, setRegions] = useState([])
  const [currentRegion, setCurrentRegion] = useState({
    code:'',
    name:''
  })
  const [subRegions, setSubRegions] = useState([])
  const [currentSubRegion, setCurrentSubRegion] = useState({
    code:'',
    name:''
  })
  const [notable, setNotable] = useState(false)
  const [taxonomy, setTaxonomy] = useState([])
  const [currentSpecies, setCurrentSpecies] = useState('')
  const [loading, setLoading] = useState(true)
  const [singleObsView, setSingleObsView] = useState(-1)
  const [filteredObservations, setFilteredObservations] = useState({
    region: '',
    obs: []
  })
  const [viewType, setViewType] = useState('list')  // 'list' or 'map'
  
  return (
    <>
      <ObservationsContext.Provider value = {{observations, setObservations,
                                                  countries, setCountries,
                                                  currentCountry, setCurrentCountry,
                                                  regions, setRegions,
                                                  currentRegion, setCurrentRegion,
                                                  subRegions, setSubRegions,
                                                  currentSubRegion, setCurrentSubRegion,
                                                  notable, setNotable,
                                                  taxonomy, setTaxonomy,
                                                  currentSpecies, setCurrentSpecies,
                                                  loading, setLoading,
                                                  singleObsView, setSingleObsView,
                                                  filteredObservations, setFilteredObservations,
                                                  viewType, setViewType}}>
        <Router>
        <Header/>
          <Routes>
            <Route path="/" element = {<LandingPage/>} />
            <Route path = "/observations" element= {
                <main>
                  <ObservationView />
                </main>
            }/>
            <Route path="/observations/:id" element={<SingleObservationView />} />
          </Routes>
          <Footer/>
          <ScrollToTopButton />
        </Router>
      </ObservationsContext.Provider>
    </>
  )
}

export default App
